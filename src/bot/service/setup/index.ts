import { Message, TextChannel } from 'discord.js';
import {  markChannelProcessed } from "../../../processedChannels";
import { setupMessages } from "../../readyMessages";
import fs from 'fs';
import { createIndex, getEmbedding, indexDiscordMessages } from '../../../opensearch';
import { channel } from 'diagnostics_channel';
import pLimit from 'p-limit';

interface RawMessage {
  id: string;
  question: string;
  answer: string;
}

interface ChunkedMessage {
  id: string;
  pergunta: string;
  embedding: number[];
}

// ========== UTILITY FUNCTIONS ==========

function chunkText(text: string, maxLen = 1000): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push(text.slice(i, i + maxLen));
  }
  return chunks;
}

function cleanMessageContent(content: string): string {
  return content
    .replace(/<@!?(\d+)>/g, '') // remove menções a usuários
    .replace(/<@&(\d+)>/g, '') // remove menções a cargos
    .trim();
}

// ========== MESSAGE PROCESSING FUNCTIONS ==========

async function fetchChannelMessages(channel: TextChannel): Promise<RawMessage[]> {
  const allMessages: Message[] = [];
  let lastMessageId: string | undefined;
console.log("fetchChannelMessages channel",channel.id);
  while (true) {
    const batch = await channel.messages.fetch({
      limit: 100,
      before: lastMessageId,
    });

    if (batch.size === 0) break;

    allMessages.push(...batch.values());
    lastMessageId = batch.last()?.id;
  }
console.log(`Fetched ${allMessages.length} messages from channel ${channel.id}`);
  return allMessages
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .map((msg, index) => ({
      id: `s${index + 1}`,
      question: cleanMessageContent(msg.content),
      answer: '',
    }));
}

async function prepareMessagesForIndexing(channel: TextChannel): Promise<ChunkedMessage[]> {
  await channel.send("⏳ Iniciando o processamento das mensagens para geração de embeddings... Isso pode levar algum tempo dependendo do volume de mensagens. Conforme progressos forem feitos, vou te atualizando aqui.");
  const rawMessages = await fetchChannelMessages(channel);
console.log("Total rawMessages fetched:", rawMessages);
  const concurrency = 5; 
  const queue: (() => Promise<ChunkedMessage>)[] = [];

  for (const [index, msg] of rawMessages.entries()) {
    if (!msg.question || msg.question.length < 15) continue;

    const chunks = chunkText(msg.question);
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      queue.push(async () => {
        const embedding = await getEmbedding(chunk);
        return {
          id: `msg${index + 1}_chunk${chunkIndex + 1}`,
          pergunta: chunk,
          embedding,
        };
      });
    }
  }

  const results: ChunkedMessage[] = [];
  const total = queue.length;
  let processed = 0;
  let nextMilestone = 25; 

  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency).map(fn => fn());
    const settled = await Promise.all(batch);
    results.push(...settled);

    processed += settled.length;
    const progress = Math.floor((processed / total) * 100);

    if (progress >= nextMilestone) {
      await channel.send(`📊 Progresso: ${progress}% concluído (${processed}/${total})`);
      nextMilestone += 25;
    }
  }

  await channel.send("✅ Processamento concluído. Todos os embeddings foram gerados!");
  return results;
}

// ========== SETUP HANDLERS ==========

export async function handleRefusedSetup(channel: TextChannel): Promise<void> {
  await markChannelProcessed(channel.id);
  await channel.send(setupMessages.declined);
  await channel.send(setupMessages.declinedNext);
}

async function handleIndexDiscordMessages(messagesToIndex:any, indexName:string) {
  try {
    const result = await indexDiscordMessages(messagesToIndex, indexName);
    console.log("Mensagens indexadas com sucesso:", result);
    return result;
  }
  catch (error) {
    console.error("Erro ao indexar mensagens:", error);
    throw error;
  }
}

async function indexMessages(channel: TextChannel, indexName : string): Promise<void> { 
  try {
    const messagesToIndex = await prepareMessagesForIndexing(channel);

    await handleIndexDiscordMessages(messagesToIndex, indexName) 

  } catch (error: any) {
    console.error("❌ Erro ao preparar mensagens:", error);
    await channel.send("❌ Erro ao preparar mensagens para indexação.");
  }
}

async function createIndexHandler(indexName: string, channel: TextChannel) {
  try {
    const response = await createIndex(indexName, channel.id);
    if (!response) throw new Error(response);

    if (response.duplicatedIndex) throw new Error(response.message);

    await indexMessages(channel, indexName);
    
    return { success: true, message: "✅ Índice criado com sucesso." };

  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Erro inesperado ao criar índice.",
    };
  }
}

async function processIndexName(msg: Message, channel: TextChannel) {
  try {
    const indexName = msg.content.trim();
    const result = await createIndexHandler(indexName, channel);

    if (result.success) await channel.send(`Preparando mensagens para indexação... Index nomedado de: **${indexName}**`);
    if (!result.success) throw new Error(result.message)
    
    return result.success;

  } catch (error: any) { 
    return false;
  }
}

export async function collectIndexName(channel: TextChannel, filter: (m: Message) => boolean) {
  const collector = channel.createMessageCollector({ filter, time: 60_000 });

  collector.on("collect", async (msg: Message) => {

    try {
      if (msg.author.bot) return;
      const success = await processIndexName(msg, channel);

      if (!success) throw new Error()
      if (success) collector.stop("success");

      await channel.send("Indice criado com sucesso, estou preparando as mensagens do histórico para indexação... Te aviso quando finalizar!")
    } catch (error: any) {
      await channel.send("❌ Erro ao processar sua solicitação.");
      collector.stop("error");
    }
    
  });
}
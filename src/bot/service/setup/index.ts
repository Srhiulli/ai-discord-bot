import { Message, TextChannel } from 'discord.js';
import {  markChannelProcessed } from "../../../processedChannels";
import { setupMessages } from "../../readyMessages";
import fs from 'fs';
import { createIndex, getEmbedding, indexDiscordMessages } from '../../../opensearch';
import { channel } from 'diagnostics_channel';

interface RawMessage {
  id: string;
  question: string;
  answer: string;
}

interface ChunkedMessage {
  id: string;
  pergunta: string;
  resposta: string;
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

  while (true) {
    const batch = await channel.messages.fetch({
      limit: 100,
      before: lastMessageId,
    });

    if (batch.size === 0) break;

    allMessages.push(...batch.values());
    lastMessageId = batch.last()?.id;
  }

  return allMessages
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .map((msg, index) => ({
      id: `faq${index + 1}`,
      question: cleanMessageContent(msg.content),
      answer: '',
    }));
}

async function prepareMessagesForIndexing(channel: TextChannel): Promise<ChunkedMessage[]> {
  const rawMessages = await fetchChannelMessages(channel);
  const chunked: ChunkedMessage[] = [];

  for (const [index, msg] of rawMessages.entries()) {
    if (!msg.question || msg.question.length < 15) continue;

    const chunks = chunkText(msg.question);
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const embedding = await getEmbedding(chunks[chunkIndex]);
      chunked.push({
        id: `msg${index + 1}_chunk${chunkIndex + 1}`,
        pergunta: chunks[chunkIndex],
        resposta: '',
        embedding,
      });
    }
  }

  return chunked;
}

// ========== SETUP HANDLERS ==========

export async function handleRefusedSetup(channel: TextChannel): Promise<void> {
  await markChannelProcessed(channel.id);
  await channel.send(setupMessages.declined);
  await channel.send(setupMessages.declinedNext);
}

async function handleCreateIndex(indexName: string, channel: TextChannel) {
  const response = await createIndex(indexName, channel.id);

  if (!response) return { success: false };

  if (response.success) return { success: true };

  if (response.duplicatedIndex) return { success: false, retry: true, message: response.message };

  return { success: false, message: response.message };
}

export async function handleNameToCreateIndex(
  channel: TextChannel,
  filter: (m: Message) => boolean
): Promise<void> {
  const nameCollector = channel.createMessageCollector({
    filter,
    time: 60000,
  });

  nameCollector.on("collect", async (msg: Message) => {
    const indexName = msg.content.trim();
    const result = await handleCreateIndex(indexName, channel);

    if (msg.author.bot) return

    if (!result.success) {
      await channel.send(result.message || "❌ Erro ao criar índice.");
      return;
    }

    nameCollector.stop();

    await channel.send(setupMessages.indexing(indexName));

    const messages = await prepareMessagesForIndexing(channel);
    await indexDiscordMessages(messages, indexName);

    await channel.send(setupMessages.indexed(indexName));
  });
}
import { Message, TextChannel } from 'discord.js';
import {  markChannelProcessed } from "../../../processedChannels";
import { setupMessages } from "../../readyMessages";
import fs from 'fs';
import { getEmbedding, indexDiscordMessages } from '../../../opensearch';

const PROCESSED_FILE = 'processed_channels.json';
let processedChannels: string[] = [];

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

function saveProcessedChannels(): void {
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(processedChannels, null, 2));
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

export async function handleIndexNameInput(channel: TextChannel, filter: (m: Message) => boolean): Promise<void> {
  const nameCollector = channel.createMessageCollector({ 
    filter, 
    time: 60000, 
    max: 1 
  });

  nameCollector.on('collect', async (msg: Message) => {
    const indexName = msg.content.trim();

    if (!indexName) {
      await channel.send(setupMessages.invalidIndex);
      return;
    }

    processedChannels.push(channel.id);
    saveProcessedChannels();

    await channel.send(setupMessages.indexing(indexName));

    const messages = await prepareMessagesForIndexing(channel);
    await indexDiscordMessages(messages, indexName);

    await channel.send(setupMessages.indexed(indexName));
  });
}

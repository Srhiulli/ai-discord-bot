import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
import { getEmbedding, indexDiscordMessages } from './opensearch';
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

if (!process.env.DISCORD_BOT_TOKEN) {
  throw new Error('DISCORD_BOT_TOKEN is not defined in environment variables.');
}

client.login(process.env.DISCORD_BOT_TOKEN);

async function fetchChannelMessages(channel: TextChannel) {
  const allMessages = [];
  let lastMessageId: string | undefined;

  while (true) {
    const batch = await channel.messages.fetch({
      limit: 100,
      before: lastMessageId
    });

    if (batch.size === 0) break;

    allMessages.push(...batch.map(msg => msg));
    lastMessageId = batch.last()?.id;
  }

  return allMessages
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .map((msg, i) => {
      const cleanedQuestion = msg.content
        .replace(/<@!?(\d+)>/g, '')   // Remove menções a usuários
        .replace(/<@&(\d+)>/g, '')    // Remove menções a cargos
        .trim();

      return {
        id: `faq${i + 1}`,
        question: cleanedQuestion,
        answer: ''
      };
    });
}

function chunkText(text: string, maxLen = 1000): string[] {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push(text.slice(i, i + maxLen));
  }
  return chunks;
}

async function prepareMessagesForIndexing(channel: TextChannel) {
  const rawMessages = await fetchChannelMessages(channel);
  const chunked = [];

  for (const [i, msg] of rawMessages.entries()) {
    if (!msg.question || msg.question.length < 15) continue; // ignora mensagens curtas

    const chunks = chunkText(msg.question);
    for (let j = 0; j < chunks.length; j++) {
      chunked.push({
        id: `msg${i + 1}_chunk${j + 1}`,
        pergunta: chunks[j],
        resposta: '',
        embedding: await getEmbedding(chunks[j])
      });
    }
  }

  return chunked;
}

client.once('ready', async () => {
  try {
    console.log(`🤖 Bot logado como ${client.user?.tag}`);

    const channelId = process.env.CANAL_ID;
    if (!channelId) throw new Error('CANAL_ID não definido no .env');

    const channel = await client.channels.fetch(channelId) as TextChannel;

    const messagesToIndex = await prepareMessagesForIndexing(channel);
    await indexDiscordMessages(messagesToIndex, 'discord-faq');

    console.log('✅ Indexação concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err);
  } finally {
    client.destroy();
  }
});
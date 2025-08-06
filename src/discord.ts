import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
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

  const sortedMessages = allMessages.sort(
    (a, b) => a.createdTimestamp - b.createdTimestamp
  );

  const result = sortedMessages.map((msg, i) => {
    const cleanedQuestion = msg.content
  .replace(/<@!?(\d+)>/g, '')   
  .replace(/<@&(\d+)>/g, '')    
  .trim();

    return {
      id: `faq${i + 1}`,
      question: cleanedQuestion,
      answer: ''
    };
  });

  return result;
}

client.once('ready', async () => {
  const channelId = process.env.CANAL_ID;
  if (!channelId) throw new Error('CANAL_ID is not defined in environment variables.');

  const channel = await client.channels.fetch(channelId) as TextChannel;

  const history = await fetchChannelMessages(channel);
  console.log(history);
});
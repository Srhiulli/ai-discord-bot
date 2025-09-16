import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
import { indexDiscordMessages } from './opensearch';
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


client.once('ready', async () => {
  try {
    console.log(`🤖 Bot logado como ${client.user?.tag}`);

    const channelId = process.env.CANAL_ID;
    if (!channelId) throw new Error('CANAL_ID não definido no .env');

    await client.channels.fetch(channelId) as TextChannel;

  } catch (err) {
    console.error('❌ Erro:', err);
  } finally {
    client.destroy();
  }
});
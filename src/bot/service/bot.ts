import { Client, GatewayIntentBits, TextChannel, Message } from 'discord.js';
import dotenv from 'dotenv';
import { generalMessages } from '../readyMessages/index';
import { helpCommand } from './commands/helpCommand';
import { askAnswer } from './commands/askAnswer';
import { CallToSetup, callSetup } from './commands/callSetup';
import { isChannelProcessed } from '../../processedChannels';

dotenv.config();
const CHANNEL_ID = process.env.CANAL_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function fetchTextChannel(channelId: string): Promise<TextChannel | null> {
  const fetched = await client.channels.fetch(channelId);

  if (fetched instanceof TextChannel) {
    console.log(`🔍 Canal de texto encontrado: ${fetched.id} - ${fetched.name}`);
    return fetched;
  }

  console.warn(`⚠️ Canal ${channelId} não é um TextChannel.`);
  return null;
}

client.once('ready', async () => {
  if (!CHANNEL_ID) throw new Error('❌ CANAL_ID não definido no .env');

  const channel = await fetchTextChannel(CHANNEL_ID);
  if (!channel) throw new Error('❌ Canal não encontrado.');

  await callSetup(channel, Message);
});

client.on('messageCreate', async (message: Message) => {
  const botId = client.user?.id;
  const isMentioned = message.mentions.has(botId ?? '');
  const question = message.content.replace(`<@!${botId}>`, '').trim();
  const channel = message.channel as TextChannel;
  const callHelp = message.content.toLowerCase().includes('ajuda') || message.content.toLowerCase().includes('help');
  const callToSetup = message.content.toLowerCase().includes('setup');

  if (message.author.bot) return;
  if (!isMentioned) return;
  if (!question || question.length === 0) {await channel.send(generalMessages.noText);return;}
  if (!('send' in message.channel)) {console.warn('Canal não suporta envio de mensagem');return;}

  if (callHelp) { await helpCommand(message); return; }
  if (callToSetup) { await CallToSetup(channel, Message, client); return; }
  
  await askAnswer(question, channel);
});

client.login(process.env.DISCORD_BOT_TOKEN);
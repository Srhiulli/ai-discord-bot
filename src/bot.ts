import { Client, GatewayIntentBits } from 'discord.js';

import dotenv from 'dotenv';
import { getAnswer } from './answer';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
  console.log(`Bot iniciado: ${client.user?.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const botId = client.user?.id;
  const isMentioned = message.mentions.has(botId || '');

  if (!isMentioned) return;

  const question = message.content.replace(`<@!${botId}>`, '').trim();

  if (typeof question !== 'string' || question.length === 0) {
    await message.channel.send('Ainda não consigo entender nada além de textos :(. Mas você pode tentar perguntar algo como "Qual é a taxa de juros do CDI?"');
    return;
  }

  try {
    const answer = await getAnswer(question);
    await message.channel.send(answer);
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    await message.channel.send('Desculpe, não consegui responder sua pergunta.');
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
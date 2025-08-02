import { Client, GatewayIntentBits } from 'discord.js';
import { answerWithRAG } from ''; 
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once('ready', () => {
  console.log(`Bot iniciado: ${client.user?.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const question = message.content;

  try {
    const answer = await answerWithRAG(question);
    await message.channel.send(answer);
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    await message.channel.send('Desculpe, não consegui responder sua pergunta.');
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
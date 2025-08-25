import { Message, TextChannel } from 'discord.js';
import { handleIndexNameInput, handleRefusedSetup } from '../setup';
import { setupMessages } from '../../readyMessages';
import { isChannelProcessed } from '../../../processedChannels';

async function handleSetupResponse(
  channel: TextChannel, 
  client: any, 
  response: string
): Promise<boolean> {
  const filter = (m: Message) => m.author.id !== client.user?.id;
  const content = response.trim().toLowerCase();

  if (content === 'não' || content === 'nao') {
    await handleRefusedSetup(channel);
    return true;
  }

  if (content === 'sim') {
    await channel.send(setupMessages.indexAsk);
    await handleIndexNameInput(channel, filter);
    return true;
  }

  return false;
}

async function startSetupProcess(
  channel: TextChannel, 
  client: any
): Promise<void> {
  const filter = (m: Message) => m.author.id !== client.user?.id;
  const collector = channel.createMessageCollector({ 
    filter, 
    time: 600000 
  });

  await channel.send(setupMessages.ask);
  await channel.send(setupMessages.warn);

  collector.on('collect', async (msg: Message) => {
    const shouldStop = await handleSetupResponse(channel, client, msg.content);
    if (shouldStop) {
      collector.stop();
    }
  });
}

export async function callSetup(
  channel: TextChannel, 
  client: any
): Promise<void> {
  const verifyProcessedChannel = await isChannelProcessed(channel.id);
  
    if (verifyProcessedChannel.processed) {
      console.log(`🔍 Canal ${channel.id} já processado.`);
    return;
  }

  await startSetupProcess(channel, client);
}

export async function CallToSetup(
  channel: TextChannel, 
  client: any
): Promise<void> {
  await startSetupProcess(channel, client);
}
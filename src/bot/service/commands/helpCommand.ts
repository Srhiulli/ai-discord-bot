import { Message } from 'discord.js';
import { generalMessages } from '../../readyMessages/index';


export async function helpCommand(message: Message) {
    if (!('send' in message.channel)) {
    console.warn('Canal não suporta envio de mensagem');
    return;
    }
    await message.channel.send(generalMessages.help);
}
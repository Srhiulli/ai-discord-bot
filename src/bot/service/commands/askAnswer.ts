import { getAnswer } from "./answer";


export async function askAnswer(question: string, channel: any) {
  try {
    const answer = await getAnswer(question);
    await channel.send(answer);
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    await channel.send('❌ Desculpe, não consegui responder sua pergunta.');
  }
}
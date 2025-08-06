import { callBedrockClaude } from './bedrock';
import { searchSimilarDocs } from './opensearch'; 


export async function getAnswer(prompt: string): Promise<string> {
  try {
    const results = await searchSimilarDocs(prompt);
    
    const context = results.map(r => r?.answer).join('\n');

    const answer = await callBedrockClaude(prompt, context);

    if(!answer) return "Desculpe, não consegui encontrar uma resposta para sua pergunta.";

    return answer;
  } catch (error) {
    console.error("❌ Erro ao obter resposta:", error);
    return "Desculpe, ocorreu um erro ao gerar a resposta.";
  }

}

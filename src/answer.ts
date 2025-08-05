import { callBedrockClaude } from './bedrock';
import { searchSimilarDocs } from './opensearch'; 

const promptTest = 'O que é renda fixa'

export async function getAnswer(prompt: string): Promise<string> {
  try {
    console.log("🔍 Buscando documentos similares...");
    const results = await searchSimilarDocs(prompt);
    
    console.log("📄 Resultados encontrados:", results);
    const context = results.map(r => r?.answer).join('\n');

    console.log("🧠 Chamando o Bedrock com contexto...");
    const answer = await callBedrockClaude(prompt, context);

    console.log("✅ Resposta gerada com sucesso!", answer);
    return answer;
  } catch (error) {
    console.error("❌ Erro ao obter resposta:", error);
    return "Desculpe, ocorreu um erro ao gerar a resposta.";
  }

}
(async () => {
  await getAnswer(promptTest);
})();
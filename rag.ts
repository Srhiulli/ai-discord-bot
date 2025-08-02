import { generateAnswer } from './bedrock';
import { searchSimilarDocs } from './opensearch'; 

export async function answerWithRAG(question: string): Promise<string> {
const results = await searchSimilarDocs(question);
const context = results.map(r => r.resposta).join('\n'); 
const answer = await generateAnswer(question, context);

  return answer;
}
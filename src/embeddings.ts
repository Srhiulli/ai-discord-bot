import { client } from './opensearch';

async function listEmbeddings() {
  const result = await client.search({
    index: 'faq-investimentos',
    size: 5,
    _source: ['pergunta', 'embedding'],
    body: {
      query: { match_all: {} },
    },
  });

  const hits = result.body.hits.hits;
  hits.forEach((hit: any, i: number) => {
    const pergunta = hit._source?.pergunta || 'Sem pergunta';
    const embedding = hit._source?.embedding;

    console.log(`\n🔹 Pergunta ${i + 1}: ${pergunta}`);

    if (Array.isArray(embedding)) {
      console.log(`🔸 Vetor (início): [${embedding.slice(0, 5).join(', ')} ...]`);
    } else {
      console.warn('⚠️  Vetor ausente ou inválido neste documento.');
    }
  });
}

listEmbeddings().catch(console.error);


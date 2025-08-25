import dotenv from 'dotenv';
dotenv.config();

import { Client } from '@opensearch-project/opensearch';
import fetch from 'node-fetch'; 
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

export const client = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: 'admin',
    password: process.env.OPENSEARCH_INITIAL_ADMIN_PASSWORD || '',
  },
  ssl: {
    rejectUnauthorized: false,
  },
});

export async function testConnection(): Promise<void> {
  try {
    const health = await client.cluster.health();
    console.log('OpenSearch status:', health.body.status);
  } catch (err) {
    console.error('Erro ao conectar OpenSearch:', err);
  }
}

export async function testDashboards(): Promise<void> {
  try {
   const response = await fetch('http://localhost:5601', {
  headers: {
    Authorization:
      'Basic ' + Buffer.from(`admin:${process.env.OPENSEARCH_INITIAL_ADMIN_PASSWORD}`).toString('base64'),
  },
});
    console.log('Dashboards status:', response.status);
  } catch (err) {
    console.error('Erro ao conectar Dashboards:', err);
  }
}

export async function OLDgetEmbedding(text: string): Promise<number[]> {
  const length = text.length;
  const wordCount = text.split(/\s+/).length;
  const hasQuestionMark = text.includes('?') ? 1 : -1;
  
  return [
    Math.sin(length),
    Math.cos(wordCount),
    length / (wordCount + 1),
    hasQuestionMark
  ];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getEmbedding(text: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, './python/embed.py');
    const py = spawn('./.venv/bin/python', [scriptPath, text]);

    let result = '';
    let error = '';

    py.stdout.on('data', (data) => {
      result += data.toString();
    });

    py.stderr.on('data', (err) => {
      error += err.toString();
    });

    py.on('close', (code) => {
      if (code !== 0) return reject(new Error(error));
      try {
        const parsed = JSON.parse(result);
        resolve(parsed);
      } catch (e) {
        reject(e);
      }
    });
  });
}

export async function createFaqIndex() {
  try {
    const response = await client.indices.create({
      index: 'faq-investimentos',
      body: {
        settings: {
          index: {
            knn: true,
            number_of_shards: 1,
            number_of_replicas: 1
          }
        },
        mappings: {
          properties: {
            embedding: {
              type: 'knn_vector',
              dimension: 384
            },
            pergunta: { type: 'text' },
            resposta: { type: 'text' }
          }
        }
      }
    });

    console.log('✅ Índice criado:', response);
  } catch (error: any) {
    if (error.body?.error?.type === 'resource_already_exists_exception') {
      console.log('⚠️ Índice já existe.');
    } else {
      console.error('❌ Erro ao criar índice:', error);
    }
  }
}

export async function indexFaqData() {
  try {
  const indexName = 'faq-investimentos';

const exists = await client.indices.exists({ index: indexName });

if (!exists.body) {
  const result = await createFaqIndex();
  console.log('📁 Índice criado:', result);
} else {
  console.log('ℹ️ Índice já existe.');
}

    const faqs = [
      {
        id: 'faq1',
        pergunta: 'O que é um investimento?',
        resposta: 'Investimento é o ato de aplicar dinheiro em ativos com o objetivo de obter retorno financeiro no futuro.',
      },
      {
        id: 'faq2',
        pergunta: 'Qual a diferença entre renda fixa e renda variável?',
        resposta: 'Na renda fixa, o investidor conhece previamente a forma de rendimento. Já na renda variável, os ganhos podem oscilar e não são garantidos.',
      },
      {
        id: 'faq3',
        pergunta: 'O Tesouro Direto é seguro?',
        resposta: 'Sim, é considerado um dos investimentos mais seguros do Brasil, pois é garantido pelo governo federal.',
      },
      {
        id: 'faq4',
        pergunta: 'Quais são os riscos de investir em ações?',
        resposta: 'As ações podem sofrer oscilações no preço, o que pode gerar prejuízos. Também há risco relacionado à saúde financeira da empresa.',
      },
      {
        id: 'faq5',
        pergunta: 'Quanto preciso para começar a investir?',
        resposta: 'É possível começar a investir com valores baixos, a partir de R$30 no Tesouro Direto, por exemplo.',
      },
    ];

      const faqsWithEmbeddings = await Promise.all(
      faqs.map(async (faq) => {
        return {
          ...faq,
          embedding: await getEmbedding(faq.pergunta)
        };
      })
      );
      for (const faq of faqsWithEmbeddings) {
      await client.index({
        index: indexName,
        id: faq.id,
        body: faq,
        refresh: true 
      });
    }
    
    console.log(`${faqs.length} FAQs indexadas com sucesso!`);

    const bulkActions = faqsWithEmbeddings.flatMap(faq => [
      { index: { _index: indexName, _id: faq.id } },
      faq
    ]);

    const { body: bulkResponse } = await client.bulk({
      body: bulkActions,
      refresh: true
    });

    if (bulkResponse.errors) {
      const erroredItems = bulkResponse.items.filter(item => item.index.error);
      console.error('❌ Erros na indexação:', erroredItems);
      throw new Error('Falha ao indexar alguns documentos');
    }

    console.log(`\n🎉 ${faqs.length} FAQs indexadas com sucesso!`);

    const { body: searchResults } = await client.search({
      index: indexName,
      body: {
        query: { match_all: {} },
        size: 100,
        _source: ["pergunta", "resposta"]
      }
    });

    console.log('\n📊 Documentos no índice:');
    searchResults.hits.hits.forEach((hit, i) => {
      console.log(`${i+1}. ID: ${hit._id} | Pergunta: "${hit._source?.pergunta}"`);
    });

  } catch (error) {
    console.error('\n❌ Erro durante a indexação:', error?.meta?.body?.error || error);
    throw error;
  }
}

export async function searchSimilarDocs(question: string) {
  const queryVector = await getEmbedding(question);
  
  const { body } = await client.search({
    index: 'faq-investimentos',
    body: {
      query: {
        knn: {
          embedding: {
            vector: queryVector,
            k: 5
          }
        }
      }
    }
  });

  return body.hits.hits.map(hit => ({
    score: hit._score,
    question: hit._source?.pergunta,
    answer: hit._source?.resposta
  }));

}

export async function indexDiscordMessages(data: any[], indexName: string) {
  const exists = await client.indices.exists({ index: indexName });
  if (!exists.body) {
    await createFaqIndex(); 
  }

  const batchSize = 300; 
  for (let i = 0; i < data.length; i += batchSize) {
    const slice = data.slice(i, i + batchSize);

    const bulkActions = slice.flatMap(doc => [
      { index: { _index: indexName, _id: doc.id } },
      doc
    ]);

    const { body: bulkResponse } = await client.bulk({
      body: bulkActions,
      refresh: false 
    });

    if (bulkResponse.errors) {
      const erroredItems = bulkResponse.items.filter(item => item.index?.error);
      console.error(`❌ Erros na indexação no lote ${i / batchSize + 1}:`, erroredItems);
    } else {
      console.log(`✅ Lote ${i / batchSize + 1} indexado com sucesso (${slice.length} docs)`);
    }
  }

  await client.indices.refresh({ index: indexName });
}




(async () => {
  await testConnection();
  await testDashboards();
})();
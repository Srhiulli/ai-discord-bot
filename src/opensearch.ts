import dotenv from 'dotenv';
dotenv.config();

import { Client } from '@opensearch-project/opensearch';
import fetch from 'node-fetch'; 
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { ERROR_OS } from './error_os_map';
import { markChannelProcessed } from './processedChannels';

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

export async function createIndex(indexName = 'faq', channelId: string) {
  try {
    const response = await client.indices.create({
      index: indexName,
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
            id: { type: 'keyword' },
            pergunta: { type: 'text' },
          }
        }
      }
    });
    await markChannelProcessed(channelId)
    return {
      success: true,
      message: response
    }
  } catch (error: any) {
    const errorType = error.body?.error?.type as keyof typeof ERROR_OS
    if ( ERROR_OS[errorType]) {
      console.log('❌ Erro ao criar índice:', ERROR_OS[errorType]);
             return {
               success: false,
               message: ERROR_OS[errorType].message,
               duplicatedIndex: ERROR_OS[errorType].duplicatedIndex || false,
    }
    } 
        return {
          success: false,
          message: error
    }
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
    return console.error(`❌ Índice "${indexName}" não existe. Crie o índice antes de indexar dados.`);
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
import dotenv from 'dotenv';
dotenv.config();

import { Client } from '@opensearch-project/opensearch';

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
    console.error('Erro ao conectar:', err);
  }
}

testConnection()
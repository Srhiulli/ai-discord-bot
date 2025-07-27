import dotenv from 'dotenv';
dotenv.config();

import { Client } from '@opensearch-project/opensearch';
import fetch from 'node-fetch'; 

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

(async () => {
  await testConnection();
  await testDashboards();
})();
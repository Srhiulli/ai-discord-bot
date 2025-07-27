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

export async function indexFaqData() {
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

  for (const faq of faqs) {
    await client.index({
      index: 'faq-investimentos',
      id: faq.id,
      body: faq,
    });
  }

  await client.indices.refresh({ index: 'faq-investimentos' });
  console.log('FAQs indexadas com sucesso!');
}

(async () => {
  await testConnection();
  await testDashboards();
})();
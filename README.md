# RAG Discord Bot

Projeto para integrar um bot Discord com pipeline RAG usando OpenSearch e Bedrock.

## Estrutura de pastas

rag-discord-bot/
├── src/
│   ├── bot.ts          # Código principal do bot Discord (escuta mensagens e responde)
│   ├── rag.ts          # Pipeline RAG: busca contexto e chama Bedrock para resposta
│   ├── opensearch.ts   # Configuração do cliente OpenSearch
│   ├── embeddings.ts   # Função para gerar embeddings dos textos (a implementar)
│   ├── index.ts        # Executar a função de adicionar datos no OpenSearch
├── .env                # Variáveis de ambiente (token Discord, senha OpenSearch, etc)
├── package.json        # Dependências e scripts do projeto Node.js
├── README.md           # Documentação do projeto

## Arquivos do projeto

- **src/**  
  Contém todos os arquivos fonte do bot Discord.

- **src/bot.ts**  
  Código principal do bot Discord (escuta mensagens e responde).

- **src/rag.ts**  
  Pipeline RAG: busca contexto e chama Bedrock para resposta.

- **src/opensearch.ts**  
  Configuração do cliente OpenSearch.

- **src/embeddings.ts**  
  Função para gerar embeddings dos textos (a implementar).

- **src/index.faqs.ts**  
  Executar a função de adicionar datos no OpenSearch.

- **.env**  
  Variáveis de ambiente (token Discord, senha OpenSearch, etc).

- **package.json**  
  Dependências e scripts do projeto Node.js.

- **README.md**  
  Documentação do projeto.

---

DISCORD_BOT_TOKEN=seu_token
OPENSEARCH_INITIAL_ADMIN_PASSWORD=senha_forte

---

## Setup rápido

1. Instale dependências:
 ```bash
 yarn install

2.	Rode OpenSearch local via Docker:
docker run -d \
  --name opensearch \
  -p 9200:9200 -p 9600:9600 \
  -e "discovery.type=single-node" \
  -e "OPENSEARCH_INITIAL_ADMIN_PASSWORD=SuaSenhaForte123!" \
  opensearchproject/opensearch:latest

3.	Configure .env com suas credenciais.

4.  Crie os documentos no OpenSearch
```bash
yarn index-faqs

5.	Rode o bot:
 ```bash
yarn dev 


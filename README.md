# Discord Bot com busca por similaridade no OS

Projeto para integrar um bot do Discord com o Bedrock, utilizando busca por similaridade para fornecer contexto nas respostas.

## Estrutura de pastas

```
rag-discord-bot/
├── src/
│   ├── bedrock.ts        # Faz chamadas autenticadas para a API da AWS Bedrock
│   ├── bot.ts            # Código principal do bot Discord
│   ├── embeddings.ts     # Gera embeddings para perguntas e documentos
│   ├── index-faqs.ts     # Indexa as FAQs com embeddings no OpenSearch
│   ├── index.ts          # Entry point opcional para testes
│   ├── opensearch.ts     # Cliente OpenSearch + funções de indexação e busca semântica
│   ├── rag.ts            # Pipeline RAG: busca e geração de resposta
│   ├── test-search.ts    # Busca por similaridade para testes
├── .env                  # Token do Discord, URL/senha do OpenSearch, etc.
```


## Variáveis de ambiente (.env)

```env
DISCORD_BOT_TOKEN=seu_token
OPENSEARCH_INITIAL_ADMIN_PASSWORD=senha_forte
AWS_ACCESS_KEY_ID=_key
AWS_SECRET_ACCESS_KEY=_key
AWS_REGION=us-east-1
```

## Setup rápido

1. Instale dependências:
```bash
yarn install
```
2.	Rode OpenSearch local via Docker:
```bash
docker compose up -d
```
3.	Configure .env com suas credenciais.

4.  Crie os documentos no OpenSearch
```bash
yarn index:data
```
5. Teste a busca por similaridade
```bash
yarn search:similar
```
5.	Rode o bot:
```bash
yarn dev 
```

## Como configurar o bot no Discord
1.	Acesse: https://discord.com/developers/applications
2.	Clique em “New Application”, dê um nome e clique em “Create”
3.	No menu lateral, vá em “Bot” > clique em “Add Bot”
4.	Ative a opção “Message Content Intent”
5.	Copie o Token do Bot e coloque no .env:`DISCORD_BOT_TOKEN=seu_token_aqui`
6.	Vá em “OAuth2” > “URL Generator”
	-	Scopes: bot
	-	Bot permissions: Send Messages, Read Message History
7.	Copie o link gerado, cole no navegador e adicione o bot ao seu servidor

## Como funciona a busca por similaridade
1.	O bot recebe uma pergunta do usuário no Discord.
2.	A pergunta é transformada em um vetor numérico (embedding).
3.	Esse vetor é comparado com os vetores dos documentos no OpenSearch.
4.	O OpenSearch retorna os documentos mais similares com base na distância vetorial.
5.	O conteúdo retornado é enviado para a IA gerar uma resposta com base no contexto encontrado.
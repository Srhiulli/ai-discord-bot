# Discord Bot com IA e busca por similaridade no OpenSearch

Projeto para integrar um bot do Discord com o Bedrock, utilizando busca por similaridade para fornecer contexto nas respostas.

## Fluxo da busca vetorial do bot
1.	O bot recebe uma pergunta do usuário no Discord.
2.	A pergunta é transformada em um vetor numérico (embedding).
3.	Esse vetor é comparado com os vetores dos documentos no OpenSearch.
4.	O OpenSearch retorna os documentos mais similares com base na distância vetorial.
5. O conteúdo retornado do OpenSearch é enviado para a IA junto da pergunta do usuário
6.	Ia gera uma resposta que o bot envia no canal

## Variáveis de ambiente (.env)

```env
# Discord
DISCORD_BOT_TOKEN=
CANAL_ID=

# AWS (para Bedrock)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=

# OpenSearch
OPENSEARCH_HOSTS=https://opensearch:9200
OPENSEARCH_USERNAME=
OPENSEARCH_PASSWORD=
OPENSEARCH_SSL_VERIFICATIONMODE=

# Opções de cluster (quando rodando local via Docker)
OPENSEARCH_INITIAL_ADMIN_PASSWORD=
OPENSEARCH_ROOT_PASSWORD=
discovery.type=single-node
OPENSEARCH_JAVA_OPTS=
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

4.  Configure seu bot 

5.	Rode o bot:
```bash
yarn dev 
```

## Como configurar o bot no Discord

1. Acesse: [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. Clique em **"New Application"**, dê um nome e clique em **"Create"**
3. No menu lateral, vá em **"Bot"** > clique em **"Add Bot"**
4. Ative a opção **"MESSAGE CONTENT INTENT"** (em *Privileged Gateway Intents*)
5. Copie o **Token do Bot** e adicione no seu arquivo `.env`:
   ```env
   DISCORD_BOT_TOKEN=seu_token_aqui
   ```
6.	Vá em **“OAuth2” > “URL Generator”**
	-	Scopes: bot
	-	Bot Permissions (mínimo necessário):
	-	✅ Read Messages/View Channels
	-	✅ Send Messages
	-	✅ Read Message History
	-	✅ Mention Everyone (opcional)
	-	✅ Use Slash Commands (opcional)
7.	Copie o link gerado, cole no navegador e adicione o bot ao seu servidor



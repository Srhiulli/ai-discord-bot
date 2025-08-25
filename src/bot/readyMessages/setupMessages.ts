export const setupMessages = {
  ask: `📥 Quer puxar o histórico deste canal para a base de dados? (responda \`sim\` ou \`não\`)`,
  warn: `⚠️ **Atenção:** Isso irá indexar todo o histórico de mensagens deste canal, incluindo perguntas e respostas com mais de 15 letras. Isso pode levar algum tempo dependendo do volume de mensagens.`,
  declined: `❌ Entendido, histórico do chat não será indexado, caso mude de ideia, é só reiniciar o bot.`,
  declinedNext: `💬 Para me fazer uma pergunta, mencione-me e escreva sua dúvida.`,
  indexAsk: `✏️ Digite o nome do índice para criar no OpenSearch:`,
  invalidIndex: `❌ Nome inválido.`,
  indexing: (indexName: string) => `⏳ Iniciando extração e indexação para o índice **${indexName}**...`,
  indexed: (indexName: string) => `✅ Indexação concluída no índice **${indexName}**!`,
};
import { getEmbedding } from "./opensearch";

const emb = await getEmbedding("O que é RAG?");
console.log(emb);

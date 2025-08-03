import { callBedrockClaude } from "./bedrock";

const resposta = await callBedrockClaude("Explique o que é RAG em IA.");
console.log("resposta: ",resposta);
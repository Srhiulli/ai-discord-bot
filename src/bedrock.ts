import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

export async function callBedrockClaude(prompt: string, context: string = ""): Promise<string> {
  const client = new BedrockRuntimeClient({ region: "us-east-1" });
  const contextualizedPrompt = context ? `${context}\n\n${prompt}` : prompt;
  const command = new InvokeModelCommand({
    modelId: "amazon.titan-text-lite-v1",
    contentType: "application/json",
    accept: "application/json",
   body: JSON.stringify({
  inputText: contextualizedPrompt,
  textGenerationConfig: {
    maxTokenCount: 512,
    temperature: 0.7,
    topP: 0.9,
  },
}),
  });

  const response = await client.send(command);
  const body = await response.body.transformToString();
  return JSON.parse(body).results?.[0]?.outputText;
}
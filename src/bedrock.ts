import { HttpRequest } from "@aws-sdk/protocol-http";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { Sha256 } from "@aws-crypto/sha256-js";
import fetch from "node-fetch";

export async function callBedrock(prompt: string) {
  const region = "us-east-1"; // sua região Bedrock
  const service = "bedrock";
  const endpoint = "https://bedrock-runtime.us-east-1.amazonaws.com";

  const body = { inputText: prompt };

  const request = new HttpRequest({
    protocol: "https:",
    hostname: "bedrock-runtime.us-east-1.amazonaws.com",
    path: "/invoke",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Amz-Target": "Bedrock.InvokeModel",
    },
    body: JSON.stringify(body),
  });

  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region,
    service,
    sha256: Sha256,
  });

  const signedRequest = await signer.sign(request);

  const response = await fetch(`${endpoint}/invoke`, {
    method: signedRequest.method,
    headers: signedRequest.headers,
    body: signedRequest.body,
  });

  if (!response.ok) {
    throw new Error(`Bedrock call failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

export async function generateAnswer(question: string, context: string): Promise<string> {
  const prompt = `Contexto: ${context}\nPergunta: ${question}\nResposta:`;
  const response = await callBedrock(prompt);
  return response.generatedText || response.outputText || JSON.stringify(response);
}
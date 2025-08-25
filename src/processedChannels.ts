import { Client } from '@opensearch-project/opensearch';
import { client } from './opensearch';

const INDEX = 'processed_channels';

export async function isChannelProcessed(channelId: string): Promise<{ processed: boolean; id?: string }> {
  const result = await client.search({
    index: INDEX,
    body: {
      size: 1, // só pega o mais recente
      sort: [{ processedAt: { order: 'desc' } }], 
      query: {
        term: { channelId }
      }
    }
  });

  const hits = result.body.hits.hits;
  const first = hits[0];

  if (!first) return { processed: false, id: undefined };

  const processed = first._source?.processed ?? false;
  const id = first._id;

  console.log(`🔍 Verificando canal processado (${channelId}):`, { id, processed });

  return { processed, id };
}

export async function markChannelProcessed(channelId: string): Promise<void> {
  try {
    const exists = await isChannelProcessed(channelId);
    if (exists) return;

    await client.index({
      index: INDEX,
      body: {
        channelId,
        processed: true,
        processedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`❌ Erro ao marcar canal como processado (${channelId}):`, error);
  }
}

export async function updateChannelProcessed(channelId: string, processed: boolean): Promise<void> {
  try {
    await client.updateByQuery({
      index: INDEX,
      body: {
        script: {
          source: "ctx._source.processed = params.processed",
          params: { processed }
        },
        query: { term: { channelId } }
      }
    });
  } catch (error) {
    console.error(`❌ Erro ao atualizar status de processado (${channelId}):`, error);
  }
}
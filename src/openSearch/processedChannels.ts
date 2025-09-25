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

  return { processed, id };
}

export async function markChannelProcessed(channelId: string): Promise<void> {
  try {
    await client.update({
      index: INDEX,
      id: channelId,
      body: {
        doc: {
          channelId,
          processed: true,
          processedAt: new Date().toISOString()
        },
        doc_as_upsert: true
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
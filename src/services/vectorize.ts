/**
 * Vectorize Service
 * Busca de estilos por similaridade semântica (alternativa ao Pinecone)
 */

interface VectorizeConfig {
  accountId: string;
  apiToken: string;
  indexName: string;
}

interface VectorizeMetadata {
  name: string;
  audience?: string;
  tone?: string;
  colors?: string;
  extraInstructions?: string;
  coverDesc?: string;
  contentDesc?: string;
  ctaDesc?: string;
  type?: string;
  lastUpdated?: string;
  [key: string]: any;
}

interface VectorizeMatch {
  id: string;
  score: number;
  metadata?: VectorizeMetadata;
}

export class VectorizeService {
  private config: VectorizeConfig;
  private baseUrl: string;

  constructor(config: VectorizeConfig) {
    this.config = config;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/vectorize`;
  }

  /**
   * Insere ou atualiza vetor no index
   */
  async upsertVector(
    id: string,
    embedding: number[],
    metadata: VectorizeMetadata
  ): Promise<boolean> {
    try {
      console.log(`[Vectorize] Upserting vector for: ${id}`);

      const response = await fetch(
        `${this.baseUrl}/indexes/${this.config.indexName}/vectors`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            vectors: [
              {
                id,
                values: embedding,
                metadata
              }
            ]
          })
        }
      );

      if (response.ok) {
        console.log('[Vectorize] Vector upserted successfully!');
        return true;
      }

      const errorText = await response.text();
      console.error('[Vectorize] Failed to upsert vector:', response.status, errorText);
      return false;
    } catch (error: any) {
      console.error('[Vectorize] Upsert error:', error.message);
      return false;
    }
  }

  /**
   * Busca estilos similares por embedding
   */
  async querySimilar(
    embedding: number[],
    topK: number = 5
  ): Promise<VectorizeMatch[]> {
    try {
      console.log(`[Vectorize] Querying similar vectors (topK=${topK})`);

      const response = await fetch(
        `${this.baseUrl}/indexes/${this.config.indexName}/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            vector: embedding,
            topK,
            returnValues: false,
            returnMetadata: true
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        const matches = data.result?.matches || [];
        
        console.log(`[Vectorize] Found ${matches.length} similar styles`);
        return matches.map((match: any) => ({
          id: match.id,
          score: match.score,
          metadata: match.metadata
        }));
      }

      console.error('[Vectorize] Query failed:', response.status);
      return [];
    } catch (error: any) {
      console.error('[Vectorize] Query error:', error.message);
      return [];
    }
  }

  /**
   * Deleta vetor do index
   */
  async deleteVector(id: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/indexes/${this.config.indexName}/vectors`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ids: [id] })
        }
      );

      return response.ok;
    } catch (error: any) {
      console.error('[Vectorize] Delete error:', error.message);
      return false;
    }
  }

  /**
   * Estatísticas do index
   */
  async getIndexStats(): Promise<{ totalVectors: number; dimensionCount: number }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/indexes/${this.config.indexName}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          totalVectors: data.result?.vectorCount || 0,
          dimensionCount: data.result?.dimensionCount || 0
        };
      }

      return { totalVectors: 0, dimensionCount: 0 };
    } catch (error: any) {
      console.error('[Vectorize] Stats error:', error.message);
      return { totalVectors: 0, dimensionCount: 0 };
    }
  }

  /**
   * Lista todos os vetores (para debugging)
   */
  async listVectors(limit: number = 100): Promise<Array<{ id: string; metadata?: VectorizeMetadata }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/indexes/${this.config.indexName}/vectors?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.result?.vectors || [];
      }

      return [];
    } catch (error: any) {
      console.error('[Vectorize] List error:', error.message);
      return [];
    }
  }
}

// Singleton
export const vectorize = process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN && process.env.VECTORIZE_INDEX_NAME
  ? new VectorizeService({
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
      indexName: process.env.VECTORIZE_INDEX_NAME || 'carousel-styles'
    })
  : null;

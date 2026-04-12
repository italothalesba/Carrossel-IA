/**
 * R2 Storage Service
 * Armazena em cache imagens geradas para reutilização
 */

interface R2Config {
  accountId: string;
  apiToken: string;
  bucketName: string;
}

interface CachedImage {
  key: string;
  url?: string;
  base64?: string;
  metadata: {
    prompt: string;
    model: string;
    createdAt: number;
    size?: number;
  };
}

export class R2StorageService {
  private config: R2Config;
  private baseUrl: string;

  constructor(config: R2Config) {
    this.config = config;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/r2`;
  }

  /**
   * Gera uma chave única baseada no prompt e modelo
   */
  private generateKey(prompt: string, model: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(`${prompt}::${model}`).digest('hex');
    return `carousel-images/${hash}.png`;
  }

  /**
   * Busca imagem em cache no R2
   */
  async getCachedImage(prompt: string, model: string): Promise<string | null> {
    try {
      const key = this.generateKey(prompt, model);
      console.log(`[R2] Checking cache for: ${key}`);

      const response = await fetch(
        `${this.baseUrl}/objects/${this.config.bucketName}/${key}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());
        const base64 = buffer.toString('base64');
        const imageUrl = `data:image/png;base64,${base64}`;
        
        console.log('[R2] Cache HIT!');
        return imageUrl;
      }

      console.log('[R2] Cache MISS');
      return null;
    } catch (error: any) {
      console.error('[R2] Cache check error:', error.message);
      return null;
    }
  }

  /**
   * Salva imagem no R2 para cache futuro
   */
  async cacheImage(prompt: string, model: string, imageBase64: string): Promise<boolean> {
    try {
      const key = this.generateKey(prompt, model);
      console.log(`[R2] Caching image: ${key}`);

      // Extrair base64 puro (remover data:image/png;base64,)
      const pureBase64 = imageBase64.includes(',') 
        ? imageBase64.split(',')[1] 
        : imageBase64;
      
      const buffer = Buffer.from(pureBase64, 'base64');

      // Upload para R2 via Workers (precisa de um Worker intermediário)
      // OU via API direta se tiver permissão
      const response = await fetch(
        `${this.baseUrl}/objects/${this.config.bucketName}/${key}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.config.apiToken}`,
            'Content-Type': 'image/png',
            'Content-Length': buffer.length.toString()
          },
          body: buffer
        }
      );

      if (response.ok) {
        console.log('[R2] Image cached successfully!');
        return true;
      }

      const errorText = await response.text();
      console.error('[R2] Failed to cache image:', response.status, errorText);
      return false;
    } catch (error: any) {
      console.error('[R2] Cache image error:', error.message);
      return false;
    }
  }

  /**
   * Lista imagens em cache (para analytics)
   */
  async listCachedImages(limit: number = 50): Promise<Array<{ key: string; size: number; uploaded: string }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/objects/${this.config.bucketName}?prefix=carousel-images&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.result?.objects || [];
      }

      return [];
    } catch (error: any) {
      console.error('[R2] List images error:', error.message);
      return [];
    }
  }

  /**
   * Deleta imagem em cache
   */
  async deleteCachedImage(key: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/objects/${this.config.bucketName}/${key}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.config.apiToken}`
          }
        }
      );

      return response.ok;
    } catch (error: any) {
      console.error('[R2] Delete image error:', error.message);
      return false;
    }
  }

  /**
   * Estatísticas de uso do cache
   */
  async getCacheStats(): Promise<{ totalImages: number; totalSize: number }> {
    const images = await this.listCachedImages(1000);
    const totalSize = images.reduce((sum, img) => sum + (img.size || 0), 0);
    
    return {
      totalImages: images.length,
      totalSize
    };
  }
}

export const r2Storage = process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN && process.env.R2_BUCKET_NAME
  ? new R2StorageService({
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
      bucketName: process.env.R2_BUCKET_NAME || 'carousel-images'
    })
  : null;

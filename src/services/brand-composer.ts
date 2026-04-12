/**
 * Composição de Imagens com Assets da Marca
 *
 * Sobrepondo logo e background reais nas imagens geradas por IA
 * via Canvas (pós-processamento no cliente).
 *
 * CORREÇÕES APLICADAS:
 * - Formato 3:4 (720x960) forçado
 * - Transparência PNG preservada (logo e background)
 * - Fundo branco para evitar fundo preto
 * - Sem overlay automático no background
 */

/**
 * Carrega uma imagem de URL ou base64
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Carrega imagem de base64
 */
function loadBase64Image(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;

    // Garantir prefix data URI
    if (base64.startsWith('data:')) {
      img.src = base64;
    } else if (base64.startsWith('/9j') || base64.startsWith('iVBOR')) {
      img.src = `data:image/jpeg;base64,${base64}`;
    } else {
      img.src = `data:image/png;base64,${base64}`;
    }
  });
}

/**
 * Dimensões padrão do carrossel Instagram (3:4)
 */
const CAROUSEL_WIDTH = 720;
const CAROUSEL_HEIGHT = 960;

/**
 * Compõe uma imagem gerada com logo e background da marca
 */
export async function composeBrandAssets(
  generatedImageUrl: string,
  options: {
    logoBase64?: string;
    backgroundBase64?: string;
    logoPosition?: 'top-right' | 'top-left' | 'center-top';
    logoSize?: 'small' | 'medium' | 'large';
    logoOpacity?: number;
    backgroundOverlay?: boolean;
    backgroundOverlayOpacity?: number;
  } = {}
): Promise<string> {
  const {
    logoBase64,
    backgroundBase64,
    logoPosition = 'top-right',
    logoSize = 'medium',
    logoOpacity = 0.95,
    backgroundOverlay = false,
    backgroundOverlayOpacity = 0.3
  } = options;

  // Se não há assets para compor, retornar original
  if (!logoBase64 && !backgroundBase64) {
    return generatedImageUrl;
  }

  try {
    // Criar canvas com dimensões FIXAS 3:4 (720x960)
    const canvas = document.createElement('canvas');
    canvas.width = CAROUSEL_WIDTH;
    canvas.height = CAROUSEL_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    // CORREÇÃO: Preencher com fundo branco para evitar fundo preto
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Desenhar background se disponível
    if (backgroundBase64) {
      const bgImg = await loadBase64Image(backgroundBase64);

      // Object-cover: escalar para cobrir todo o canvas
      const bgRatio = Math.max(canvas.width / bgImg.width, canvas.height / bgImg.height);
      const bgWidth = bgImg.width * bgRatio;
      const bgHeight = bgImg.height * bgRatio;
      const bgX = (canvas.width - bgWidth) / 2;
      const bgY = (canvas.height - bgHeight) / 2;

      ctx.drawImage(bgImg, bgX, bgY, bgWidth, bgHeight);

      // Overlay escuro APENAS se explicitamente solicitado
      if (backgroundOverlay) {
        ctx.fillStyle = `rgba(0, 0, 0, ${backgroundOverlayOpacity})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    // 2. Desenhar imagem gerada por cima
    ctx.globalAlpha = 1;

    try {
      const generatedImg = await loadImage(generatedImageUrl);

      if (backgroundBase64) {
        // Com background: blend suave
        ctx.globalAlpha = 0.85;
        ctx.drawImage(generatedImg, 0, 0, CAROUSEL_WIDTH, CAROUSEL_HEIGHT);
        ctx.globalAlpha = 1;
      } else {
        // Sem background: esticar para 3:4
        ctx.drawImage(generatedImg, 0, 0, CAROUSEL_WIDTH, CAROUSEL_HEIGHT);
      }
    } catch (imgError) {
      console.warn('[BrandComposer] Failed to load generated image:', imgError);
    }

    // 3. Sobrepor logo se disponível
    if (logoBase64) {
      try {
        const logoImg = await loadBase64Image(logoBase64);

        const sizeRatios = { small: 0.08, medium: 0.12, large: 0.18 };
        const logoWidth = CAROUSEL_WIDTH * sizeRatios[logoSize];
        const logoHeight = (logoImg.height / logoImg.width) * logoWidth;

        let logoX: number;
        let logoY: number;
        const margin = CAROUSEL_WIDTH * 0.04;

        switch (logoPosition) {
          case 'top-left':
            logoX = margin;
            logoY = margin;
            break;
          case 'center-top':
            logoX = (CAROUSEL_WIDTH - logoWidth) / 2;
            logoY = margin;
            break;
          case 'top-right':
          default:
            logoX = CAROUSEL_WIDTH - logoWidth - margin;
            logoY = margin;
            break;
        }

        ctx.globalAlpha = logoOpacity;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);
        ctx.globalAlpha = 1;
      } catch (logoError) {
        console.warn('[BrandComposer] Failed to load logo, skipping:', logoError);
      }
    }

    // CORREÇÃO: PNG para preservar transparência do logo
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('[BrandComposer] Error composing brand assets:', error);
    return generatedImageUrl;
  }
}

/**
 * Compõe múltiplas imagens com os assets da marca (batch processing)
 */
export async function composeBrandAssetsBatch(
  imageUrls: string[],
  options: {
    logoBase64?: string;
    backgroundBase64?: string;
    logoPosition?: 'top-right' | 'top-left' | 'center-top';
    logoSize?: 'small' | 'medium' | 'large';
    logoOpacity?: number;
    backgroundOverlay?: boolean;
    backgroundOverlayOpacity?: number;
  } = {}
): Promise<string[]> {
  const results: string[] = [];

  for (const url of imageUrls) {
    if (url) {
      const composed = await composeBrandAssets(url, options);
      results.push(composed);
    } else {
      results.push(url);
    }
  }

  return results;
}

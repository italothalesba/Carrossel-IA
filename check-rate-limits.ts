/**
 * Script para verificar status de rate limits de todas as APIs
 * Uso: npx tsx check-rate-limits.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Importar serviços
import { apiManager, getRateLimitReport, getBestAvailableProvider } from './src/api-rotation';
import { rateLimitTracker } from './src/services/rate-limit-tracker';

// Inicializar
apiManager.initialize();

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 VERIFICADOR DE RATE LIMITS E DISPONIBILIDADE DE APIs');
  console.log('='.repeat(80));
  console.log(`🕐 ${new Date().toLocaleString('pt-BR')}\n`);

  // Obter relatório completo
  const report = getRateLimitReport();
  console.log(report);

  // Obter melhor provider disponível
  const best = getBestAvailableProvider();
  console.log('\n' + '='.repeat(80));
  console.log('💡 MELHOR PROVIDER PARA USAR AGORA:');
  console.log('='.repeat(80));
  
  if (best.isAvailable) {
    console.log(`✅ ${best.providerName}`);
    console.log(`   Status: Disponível para uso imediato`);
  } else {
    console.log(`⏰ ${best.providerName}`);
    console.log(`   Estará disponível em: ${best.waitTime}`);
  }

  // Resumo rápido
  const status = rateLimitTracker.getAllApisStatus();
  console.log('\n' + '='.repeat(80));
  console.log('📈 RESUMO:');
  console.log('='.repeat(80));
  console.log(`✅ APIs Disponíveis: ${status.availableCount}`);
  console.log(`🔴 APIs Limitadas: ${status.limitedCount}`);
  console.log(`📊 Total de APIs: ${status.rateLimits.length}`);

  // APIs em cooldown
  const cooldowns = status.cooldowns.filter(c => c.isCoolingDown);
  if (cooldowns.length > 0) {
    console.log('\n⏸️  APIs em Cooldown:');
    cooldowns.forEach(cd => {
      const waitMs = cd.cooldownEndsAt ? cd.cooldownEndsAt - Date.now() : 0;
      const waitSec = Math.ceil(Math.max(0, waitMs) / 1000);
      console.log(`   • ${cd.providerName}: ${waitSec}s (${cd.cooldownReason})`);
    });
  }

  // APIs perto do limite (>80%)
  const nearLimit = status.rateLimits.filter(rl => rl.usagePercent > 80);
  if (nearLimit.length > 0) {
    console.log('\n⚠️  APIs Próximas do Limite:');
    nearLimit.forEach(rl => {
      console.log(`   • ${rl.providerName}: ${rl.currentUsage}/${rl.limit} (${rl.usagePercent}%)`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('💡 DICAS:');
  console.log('='.repeat(80));
  console.log('• Use /api/ai/rate-limits para ver status completo via API');
  console.log('• Use /api/ai/rate-limits/report para relatório em texto');
  console.log('• O sistema automaticamente evita APIs em cooldown');
  console.log('• Rate limits são baseados nos planos gratuitos oficiais');
  console.log('='.repeat(80) + '\n');
}

main().catch(console.error);

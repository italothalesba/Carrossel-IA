/**
 * Diagnóstico de APIs ao iniciar o servidor
 * Testa conectividade de cada provider e desabilita os que falham
 * Gera logs detalhados para diagnóstico futuro
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ApiDiagnosticResult {
  providerId: string;
  providerName: string;
  type: string;
  status: 'online' | 'offline' | 'unauthorized' | 'quota_exceeded' | 'timeout';
  latency: number;
  statusCode?: number;
  errorMessage?: string;
  timestamp: number;
}

const DIAGNOSTIC_LOG_DIR = path.join(process.cwd(), 'logs');
const DIAGNOSTIC_LOG_FILE = path.join(DIAGNOSTIC_LOG_DIR, `api-diagnostic-${new Date().toISOString().split('T')[0]}.jsonl`);

// Garantir que diretório de logs existe
if (!fs.existsSync(DIAGNOSTIC_LOG_DIR)) {
  fs.mkdirSync(DIAGNOSTIC_LOG_DIR, { recursive: true });
}

function logDiagnostic(result: ApiDiagnosticResult): void {
  const logLine = JSON.stringify(result) + '\n';
  fs.appendFileSync(DIAGNOSTIC_LOG_FILE, logLine);
  console.log(`[API DIAGNOSTIC] ${result.providerId}: ${result.status} (${result.latency}ms)`);
}

async function testOpenRouter(apiKey: string, model: string, timeoutMs: number = 10000): Promise<{ ok: boolean; status?: number; latency: number; error?: string }> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3018',
        'X-Title': 'Carrossel-IA-Diagnostic'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 10
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      return { ok: true, status: response.status, latency };
    }
    
    const errorText = await response.text().catch(() => '');
    return { ok: false, status: response.status, latency, error: errorText.substring(0, 200) };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    return { ok: false, latency, error: error.message };
  }
}

async function testGroq(apiKey: string, timeoutMs: number = 10000): Promise<{ ok: boolean; status?: number; latency: number; error?: string }> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 10
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      return { ok: true, status: response.status, latency };
    }
    
    const errorText = await response.text().catch(() => '');
    return { ok: false, status: response.status, latency, error: errorText.substring(0, 200) };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    return { ok: false, latency, error: error.message };
  }
}

async function testFireworks(apiKey: string, timeoutMs: number = 10000): Promise<{ ok: boolean; status?: number; latency: number; error?: string }> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 10
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      return { ok: true, status: response.status, latency };
    }
    
    const errorText = await response.text().catch(() => '');
    return { ok: false, status: response.status, latency, error: errorText.substring(0, 200) };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    return { ok: false, latency, error: error.message };
  }
}

async function testCloudflareImage(apiToken: string, accountId: string, timeoutMs: number = 15000): Promise<{ ok: boolean; status?: number; latency: number; error?: string }> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'test',
          num_steps: 1
        }),
        signal: controller.signal
      }
    );
    
    clearTimeout(timeout);
    const latency = Date.now() - startTime;
    
    if (response.ok) {
      return { ok: true, status: response.status, latency };
    }
    
    const errorText = await response.text().catch(() => '');
    return { ok: false, status: response.status, latency, error: errorText.substring(0, 200) };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    return { ok: false, latency, error: error.message };
  }
}

export async function runApiDiagnostics(): Promise<{
  results: ApiDiagnosticResult[];
  summary: {
    total: number;
    online: number;
    offline: number;
    disabled: number;
  };
  disabledProviders: string[];
}> {
  console.log('\n========================================');
  console.log('  API DIAGNOSTIC - Starting...');
  console.log('========================================\n');

  const results: ApiDiagnosticResult[] = [];
  const disabledProviders: string[] = [];

  // ---------- OPENROUTER (Nemotron) ----------
  const orKeys = [
    { id: 'nemotron-1', name: 'Nemotron (Italo)', key: process.env.OPENROUTER_API_KEY },
    { id: 'nemotron-2', name: 'Nemotron (Odonto)', key: process.env.OPENROUTER_API_KEY_BACKUP },
    { id: 'nemotron-3', name: 'Nemotron (Coruja)', key: process.env.OPENROUTER_API_KEY_3 },
  ];

  for (const { id, name, key } of orKeys) {
    if (!key) {
      const result: ApiDiagnosticResult = { providerId: id, providerName: name, type: 'openrouter', status: 'offline', latency: 0, errorMessage: 'No API key configured', timestamp: Date.now() };
      results.push(result);
      logDiagnostic(result);
      disabledProviders.push(id);
      continue;
    }

    const testResult = await testOpenRouter(key, 'nvidia/nemotron-3-super-120b-a12b:free');
    let status: ApiDiagnosticResult['status'] = 'online';
    if (!testResult.ok) {
      if (testResult.status === 401) status = 'unauthorized';
      else if (testResult.status === 429) status = 'quota_exceeded';
      else if (testResult.error?.includes('timeout') || testResult.error?.includes('abort')) status = 'timeout';
      else status = 'offline';
      disabledProviders.push(id);
    }

    const result: ApiDiagnosticResult = {
      providerId: id, providerName: name, type: 'openrouter',
      status, latency: testResult.latency, statusCode: testResult.status,
      errorMessage: testResult.error, timestamp: Date.now()
    };
    results.push(result);
    logDiagnostic(result);
  }

  // ---------- GROQ ----------
  const groqKeys = [
    { id: 'groq-1', name: 'Groq (Italo)', key: process.env.GROQ_API_KEY },
    { id: 'groq-2', name: 'Groq (Odonto)', key: process.env.GROQ_API_KEY_BACKUP_1 },
    { id: 'groq-3', name: 'Groq (Coruja)', key: process.env.GROQ_API_KEY_BACKUP_2 },
  ];

  for (const { id, name, key } of groqKeys) {
    if (!key) {
      const result: ApiDiagnosticResult = { providerId: id, providerName: name, type: 'groq', status: 'offline', latency: 0, errorMessage: 'No API key configured', timestamp: Date.now() };
      results.push(result);
      logDiagnostic(result);
      disabledProviders.push(id);
      continue;
    }

    const testResult = await testGroq(key);
    let status: ApiDiagnosticResult['status'] = 'online';
    if (!testResult.ok) {
      if (testResult.status === 401) status = 'unauthorized';
      else if (testResult.status === 429) status = 'quota_exceeded';
      else status = 'offline';
      disabledProviders.push(id);
    }

    const result: ApiDiagnosticResult = {
      providerId: id, providerName: name, type: 'groq',
      status, latency: testResult.latency, statusCode: testResult.status,
      errorMessage: testResult.error, timestamp: Date.now()
    };
    results.push(result);
    logDiagnostic(result);
  }

  // ---------- FIREWORKS ----------
  const fwKeys = [
    { id: 'fireworks-1', name: 'Fireworks (Italo)', key: process.env.FIREWORKS_API_KEY },
    { id: 'fireworks-2', name: 'Fireworks (Coruja)', key: process.env.FIREWORKS_API_KEY_BACKUP_1 },
    { id: 'fireworks-3', name: 'Fireworks (Odonto)', key: process.env.FIREWORKS_API_KEY_BACKUP_2 },
  ];

  for (const { id, name, key } of fwKeys) {
    if (!key) {
      const result: ApiDiagnosticResult = { providerId: id, providerName: name, type: 'fireworks', status: 'offline', latency: 0, errorMessage: 'No API key configured', timestamp: Date.now() };
      results.push(result);
      logDiagnostic(result);
      disabledProviders.push(id);
      continue;
    }

    const testResult = await testFireworks(key);
    let status: ApiDiagnosticResult['status'] = 'online';
    if (!testResult.ok) {
      if (testResult.status === 401) status = 'unauthorized';
      else if (testResult.status === 429) status = 'quota_exceeded';
      else status = 'offline';
      disabledProviders.push(id);
    }

    const result: ApiDiagnosticResult = {
      providerId: id, providerName: name, type: 'fireworks',
      status, latency: testResult.latency, statusCode: testResult.status,
      errorMessage: testResult.error, timestamp: Date.now()
    };
    results.push(result);
    logDiagnostic(result);
  }

  // ---------- CLOUDFLARE IMAGE ----------
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (cfToken && cfAccountId) {
    const cfResult = await testCloudflareImage(cfToken, cfAccountId);
    let status: ApiDiagnosticResult['status'] = 'online';
    if (!cfResult.ok) {
      if (cfResult.status === 401) status = 'unauthorized';
      else if (cfResult.status === 429) status = 'quota_exceeded';
      else status = 'offline';
      disabledProviders.push('cloudflare-image');
    }

    const result: ApiDiagnosticResult = {
      providerId: 'cloudflare-image', providerName: 'Cloudflare FLUX.1', type: 'cloudflare-image',
      status, latency: cfResult.latency, statusCode: cfResult.status,
      errorMessage: cfResult.error, timestamp: Date.now()
    };
    results.push(result);
    logDiagnostic(result);
  }

  // ---------- RESUMO ----------
  const online = results.filter(r => r.status === 'online').length;
  const offline = results.filter(r => r.status !== 'online').length;

  console.log('\n========================================');
  console.log('  API DIAGNOSTIC - Summary');
  console.log('========================================');
  console.log(`  Total tested: ${results.length}`);
  console.log(`  ✅ Online:    ${online}`);
  console.log(`  ❌ Offline:   ${offline}`);
  console.log(`  Disabled:     ${disabledProviders.join(', ') || 'none'}`);
  console.log(`  Log file:     ${DIAGNOSTIC_LOG_FILE}`);
  console.log('========================================\n');

  // Salvar resumo em arquivo
  const summaryFile = path.join(DIAGNOSTIC_LOG_DIR, 'api-diagnostic-summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify({
    timestamp: Date.now(),
    total: results.length,
    online,
    offline,
    disabledProviders,
    results
  }, null, 2));

  return {
    results,
    summary: { total: results.length, online, offline, disabled: disabledProviders.length },
    disabledProviders
  };
}

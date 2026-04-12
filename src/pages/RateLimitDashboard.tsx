/**
 * Rate Limit Dashboard - Versão Simplificada
 * Teste para garantir que renderiza
 */

import { useState, useEffect } from 'react';

export default function RateLimitDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    console.log('[DASHBOARD] Component mounted');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('[DASHBOARD] Starting fetch...');
      setLoading(true);
      setError(null);

      console.log('[DASHBOARD] Fetching /api/ai/rate-limits...');
      const res1 = await fetch('/api/ai/rate-limits');
      console.log('[DASHBOARD] rate-limits response:', res1.status);
      
      if (!res1.ok) {
        throw new Error(`rate-limits endpoint returned ${res1.status}`);
      }
      
      const rateLimits = await res1.json();
      console.log('[DASHBOARD] rate-limits data:', Object.keys(rateLimits));

      console.log('[DASHBOARD] Fetching /api/ai/status...');
      const res2 = await fetch('/api/ai/status');
      console.log('[DASHBOARD] status response:', res2.status);
      
      if (!res2.ok) {
        throw new Error(`status endpoint returned ${res2.status}`);
      }
      
      const status = await res2.json();
      console.log('[DASHBOARD] status data:', Object.keys(status));

      setData({
        rateLimits: rateLimits.rateLimits || [],
        summary: rateLimits.summary || {},
        providers: status.providers || [],
        cooldowns: rateLimits.cooldowns || []
      });

      console.log('[DASHBOARD] Fetch complete!');
    } catch (err: any) {
      console.error('[DASHBOARD] Error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
      console.log('[DASHBOARD] Loading set to false');
    }
  };

  console.log('[DASHBOARD] Render - loading:', loading, 'error:', error, 'data:', !!data);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>⏳ Carregando dashboard...</h2>
        <p>Buscando dados dos rate limits...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'red' }}>❌ Erro ao carregar dashboard</h2>
        <p style={{ color: '#666' }}>{error}</p>
        <button onClick={fetchData} style={{ padding: '10px 20px', marginTop: '20px' }}>
          🔄 Tentar Novamente
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>⚠️ Sem dados</h2>
        <button onClick={fetchData} style={{ padding: '10px 20px', marginTop: '20px' }}>
          🔄 Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1>📊 Dashboard de Rate Limits</h1>
      <p>Monitoramento em tempo real de todas as APIs</p>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#10b981', color: 'white', padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{data.summary.available || 0}</div>
          <div>APIs Disponíveis</div>
        </div>
        <div style={{ background: '#ef4444', color: 'white', padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{data.summary.limited || 0}</div>
          <div>Limitadas</div>
        </div>
        <div style={{ background: '#3b82f6', color: 'white', padding: '20px', borderRadius: '12px' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{data.summary.total || 0}</div>
          <div>Total de Providers</div>
        </div>
      </div>

      {/* Rate Limits Table */}
      <h2>🔌 Rate Limits por Provider</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f3f4f6' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Provider</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Uso</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Limite</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>% Uso</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.rateLimits.map((rl: any, idx: number) => (
              <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px' }}>{rl.providerName || rl.providerId}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{rl.currentUsage || 0}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{rl.limit || 0}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{rl.usagePercent || 0}%</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  {rl.isLimited ? (
                    <span style={{ color: '#ef4444' }}>🔴 Limitado</span>
                  ) : (
                    <span style={{ color: '#10b981' }}>🟢 OK</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.rateLimits.length === 0 && (
        <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
          Nenhum dado de rate limit disponível
        </p>
      )}

      {/* Refresh Button */}
      <button 
        onClick={fetchData} 
        style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px',
          padding: '12px 24px',
          background: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        🔄 Atualizar
      </button>
    </div>
  );
}

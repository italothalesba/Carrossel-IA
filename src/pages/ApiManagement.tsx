import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Zap,
  ZapOff,
  Trash2,
  Plus,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Power,
  RotateCcw,
  Play,
  Trophy,
  TrendingUp,
  Clock,
  Timer,
  Hourglass
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ApiRanking {
  providerId: string;
  name: string;
  score: number;
  successRate: number;
  averageLatency: number;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'disabled';
  quotaExhausted: boolean;
}

interface ApiProvider {
  id: string;
  name: string;
  type: string;
  model: string;
  enabled: boolean;
  stats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    lastUsed: number | null;
    lastError: string | null;
    lastErrorTime: number | null;
  };
}

interface CooldownInfo {
  providerId: string;
  providerName: string;
  isCoolingDown: boolean;
  cooldownEndsAt: number | null;
  cooldownReason: string | null;
  waitMs: number;
  waitSeconds: number;
  nextRetryAt: number | null;
}

interface ApiStatus {
  ranking: ApiRanking[];
  providers: ApiProvider[];
  totalProviders: number;
  healthyProviders: number;
  cooldowns: CooldownInfo[];
  timestamp: number;
}

// Componente de relógio de contagem regressiva
function CountdownClock({ seconds, label, size = 'md' }: { seconds: number; label: string; size?: 'sm' | 'md' | 'lg' }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining]);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isUrgent = remaining <= 30;
  const isWarning = remaining <= 60 && remaining > 30;

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-2xl px-4 py-2'
  };

  if (remaining <= 0) {
    return null;
  }

  return (
    <div className={cn(
      "inline-flex items-center space-x-2 rounded-lg font-mono font-bold",
      sizeClasses[size],
      isUrgent ? "bg-red-100 text-red-700 animate-pulse" :
      isWarning ? "bg-yellow-100 text-yellow-700" :
      "bg-blue-100 text-blue-700"
    )}>
      <Timer size={size === 'lg' ? 20 : 14} className={isUrgent ? "animate-spin" : ""} />
      <span>{String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
      {size === 'lg' && <span className="text-xs font-normal ml-2">({label})</span>}
    </div>
  );
}

export default function ApiManagement() {
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [, setNow] = useState(Date.now());
  const [newApi, setNewApi] = useState({
    name: '',
    type: 'gemini',
    baseUrl: '',
    model: '',
    apiKey: ''
  });

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/status');
      const rateLimitsResponse = await fetch('/api/ai/rate-limits');
      const data = await response.json();
      const rateLimitsData = await rateLimitsResponse.json();
      
      // Merge cooldown data
      setApiStatus({
        ...data,
        cooldowns: rateLimitsData.cooldowns || []
      });
    } catch (error) {
      console.error('Failed to fetch API status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Atualizar relógios a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calcular média de tempo para todas as APIs liberarem
  const averageReleaseTime = useMemo(() => {
    if (!apiStatus?.cooldowns) return { waitMs: 0, waitSeconds: 0, hasCooldowns: false };
    
    const activeCooldowns = apiStatus.cooldowns.filter(c => c.isCoolingDown && c.waitMs > 0);
    if (activeCooldowns.length === 0) {
      return { waitMs: 0, waitSeconds: 0, hasCooldowns: false };
    }

    const totalWait = activeCooldowns.reduce((sum, c) => sum + c.waitMs, 0);
    const avgWait = totalWait / activeCooldowns.length;
    
    return {
      waitMs: avgWait,
      waitSeconds: Math.ceil(avgWait / 1000),
      hasCooldowns: true
    };
  }, [apiStatus]);

  // Calcular quando TODAS as APIs estarão disponíveis (máximo)
  const maxReleaseTime = useMemo(() => {
    if (!apiStatus?.cooldowns) return { waitMs: 0, waitSeconds: 0, hasCooldowns: false };
    
    const activeCooldowns = apiStatus.cooldowns.filter(c => c.isCoolingDown && c.waitMs > 0);
    if (activeCooldowns.length === 0) {
      return { waitMs: 0, waitSeconds: 0, hasCooldowns: false };
    }

    const maxWait = Math.max(...activeCooldowns.map(c => c.waitMs));
    
    return {
      waitMs: maxWait,
      waitSeconds: Math.ceil(maxWait / 1000),
      hasCooldowns: true
    };
  }, [apiStatus]);

  const testProvider = async (id: string) => {
    setTestingId(id);
    try {
      const response = await fetch(`/api/ai/providers/${id}/test`, {
        method: 'POST'
      });
      const data = await response.json();
      console.log('Test result:', data);
      fetchStatus(); // Atualiza lista
    } catch (error) {
      console.error('Failed to test provider:', error);
    } finally {
      setTestingId(null);
    }
  };

  const enableProvider = async (id: string) => {
    try {
      await fetch(`/api/ai/providers/${id}/enable`, { method: 'POST' });
      fetchStatus();
    } catch (error) {
      console.error('Failed to enable provider:', error);
    }
  };

  const removeProvider = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este provider?')) return;
    try {
      await fetch(`/api/ai/providers/${id}`, { method: 'DELETE' });
      fetchStatus();
    } catch (error) {
      console.error('Failed to remove provider:', error);
    }
  };

  const resetStats = async (id: string) => {
    try {
      await fetch(`/api/ai/providers/${id}/reset-stats`, { method: 'POST' });
      fetchStatus();
    } catch (error) {
      console.error('Failed to reset stats:', error);
    }
  };

  const addProvider = async () => {
    try {
      const response = await fetch('/api/ai/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApi)
      });
      
      if (response.ok) {
        setShowAddForm(false);
        setNewApi({ name: '', type: 'gemini', baseUrl: '', model: '', apiKey: '' });
        fetchStatus();
      }
    } catch (error) {
      console.error('Failed to add provider:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'degraded':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'unhealthy':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <ZapOff className="text-gray-500" size={20} />;
    }
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-500" size={24} />;
    if (index === 1) return <span className="text-2xl">🥈</span>;
    if (index === 2) return <span className="text-2xl">🥉</span>;
    return <span className="text-lg font-bold text-gray-400">#{index + 1}</span>;
  };

  if (!apiStatus) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <RefreshCw size={40} className="animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  Gerenciamento de APIs
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {apiStatus.totalProviders} providers configurados • {apiStatus.healthyProviders} saudáveis
                </p>
              </div>
            </div>
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={cn(loading && 'animate-spin')} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Painel de Relógios - Tempo para liberar APIs */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg border-2 border-purple-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Hourglass size={24} className="text-purple-600" />
            <span>⏱️ Relógios de Disponibilidade das APIs</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Relógio Grande - Quando TODAS estarão disponíveis */}
            <div className="md:col-span-1 bg-white rounded-lg p-6 border-2 border-purple-300 shadow-md">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Clock size={24} className="text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Todas APIs Disponíveis
                  </h3>
                </div>
                {averageReleaseTime.hasCooldowns || maxReleaseTime.hasCooldowns ? (
                  <CountdownClock
                    seconds={maxReleaseTime.waitSeconds}
                    label="máximo"
                    size="lg"
                  />
                ) : (
                  <div className="text-2xl font-bold text-green-600">✅ Todas liberadas</div>
                )}
                <p className="text-xs text-gray-500 mt-3">
                  Última API a liberar
                </p>
              </div>
            </div>

            {/* Relógio Grande - Média de tempo */}
            <div className="md:col-span-1 bg-white rounded-lg p-6 border-2 border-blue-300 shadow-md">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Activity size={24} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Tempo Médio
                  </h3>
                </div>
                {averageReleaseTime.hasCooldowns ? (
                  <CountdownClock
                    seconds={averageReleaseTime.waitSeconds}
                    label="média"
                    size="lg"
                  />
                ) : (
                  <div className="text-2xl font-bold text-green-600">✅ Sem delays</div>
                )}
                <p className="text-xs text-gray-500 mt-3">
                  {apiStatus?.cooldowns?.filter(c => c.isCoolingDown).length || 0} API(s) em cooldown
                </p>
              </div>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="md:col-span-1 bg-white rounded-lg p-6 border-2 border-green-300 shadow-md">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <Zap size={24} className="text-green-600" />
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    APIs Prontas
                  </h3>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {apiStatus?.providers.filter(p => p.enabled).length || 0}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  providers habilitados
                </p>
              </div>
            </div>
          </div>

          {/* Lista de Relógios Individuais */}
          {apiStatus?.cooldowns && apiStatus.cooldowns.filter(c => c.isCoolingDown).length > 0 ? (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <Timer size={16} className="text-orange-600" />
                <span>Relógios Individuais por API</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {apiStatus.cooldowns
                  .filter(c => c.isCoolingDown && c.waitSeconds > 0)
                  .sort((a, b) => a.waitSeconds - b.waitSeconds)
                  .map((cooldown) => (
                    <div
                      key={cooldown.providerId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {cooldown.providerName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {cooldown.cooldownReason || 'Aguardando...'}
                        </p>
                      </div>
                      <CountdownClock
                        seconds={cooldown.waitSeconds}
                        label="restante"
                        size="sm"
                      />
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle size={20} />
                <span className="font-semibold">Nenhuma API em cooldown - Todas prontas para uso!</span>
              </div>
            </div>
          )}
        </div>

        {/* Ranking Top */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Trophy size={24} className="text-yellow-500" />
            <span>🏆 Ranking de APIs (Melhor para Menor)</span>
          </h2>
          
          {apiStatus.ranking.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma API configurada ainda
            </div>
          ) : (
            <div className="space-y-3">
              {apiStatus.ranking.map((api, index) => (
                <div
                  key={api.providerId}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border-2 transition-all",
                    index === 0 ? "border-yellow-500 bg-yellow-50" :
                    index === 1 ? "border-gray-300 bg-gray-50" :
                    index === 2 ? "border-orange-300 bg-orange-50" :
                    "border-gray-200 hover:border-purple-300"
                  )}
                >
                  <div className="flex items-center space-x-4">
                    {getRankBadge(index)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{api.name}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm">
                        <span className="flex items-center space-x-1">
                          <Activity size={14} className="text-blue-500" />
                          <span>Score: <strong className="text-blue-600">{api.score}</strong></span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <CheckCircle size={14} className="text-green-500" />
                          <span>Sucesso: <strong className="text-green-600">{api.successRate}%</strong></span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock size={14} className="text-purple-500" />
                          <span>Latência: <strong className="text-purple-600">{api.averageLatency}ms</strong></span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(api.status)}
                    {api.quotaExhausted && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        Quota Esgotada
                      </span>
                    )}
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold",
                      api.status === 'healthy' ? "bg-green-100 text-green-700" :
                      api.status === 'degraded' ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    )}>
                      {api.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista de Providers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Zap size={24} className="text-purple-600" />
              <span>Providers Configurados</span>
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={18} />
              <span>Adicionar API</span>
            </button>
          </div>

          {/* Form de Adição */}
          {showAddForm && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <h3 className="font-semibold text-gray-900 mb-4">Nova API Provider</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nome (ex: Gemini 5)"
                  value={newApi.name}
                  onChange={(e) => setNewApi({ ...newApi, name: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <select
                  value={newApi.type}
                  onChange={(e) => setNewApi({ ...newApi, type: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="together">Together AI</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="huggingface">HuggingFace</option>
                </select>
                <input
                  type="text"
                  placeholder="Base URL"
                  value={newApi.baseUrl}
                  onChange={(e) => setNewApi({ ...newApi, baseUrl: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg col-span-2"
                />
                <input
                  type="text"
                  placeholder="Model (ex: gemini-2.0-flash)"
                  value={newApi.model}
                  onChange={(e) => setNewApi({ ...newApi, model: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg col-span-2"
                />
                <input
                  type="password"
                  placeholder="API Key"
                  value={newApi.apiKey}
                  onChange={(e) => setNewApi({ ...newApi, apiKey: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg col-span-2"
                />
              </div>
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={addProvider}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de Providers */}
          <div className="space-y-4">
            {apiStatus.providers.map((provider) => {
              // Encontrar cooldown deste provider
              const cooldown = apiStatus?.cooldowns?.find(c => c.providerId === provider.id);
              const isInCooldown = cooldown?.isCoolingDown && cooldown.waitSeconds > 0;

              return (
                <div
                  key={provider.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {provider.enabled ? (
                        isInCooldown ? (
                          <AlertTriangle className="text-yellow-500" size={20} />
                        ) : (
                          <Zap className="text-green-500" size={20} />
                        )
                      ) : (
                        <ZapOff className="text-gray-400" size={20} />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                        <p className="text-xs text-gray-600">{provider.type} • {provider.model}</p>
                        {isInCooldown && (
                          <div className="mt-1">
                            <CountdownClock
                              seconds={cooldown!.waitSeconds}
                              label="disponível"
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <div className="text-right mr-4">
                      <p className="text-gray-600">
                        {provider.stats.totalRequests} requisições
                      </p>
                      <p className="text-gray-500 text-xs">
                        {provider.stats.averageLatency > 0 && `${Math.round(provider.stats.averageLatency)}ms média`}
                      </p>
                    </div>

                    <button
                      onClick={() => testProvider(provider.id)}
                      disabled={testingId === provider.id}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                      title="Testar"
                    >
                      {testingId === provider.id ? <RefreshCw size={18} className="animate-spin" /> : <Play size={18} />}
                    </button>

                    {!provider.enabled && (
                      <button
                        onClick={() => enableProvider(provider.id)}
                        className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600"
                        title="Habilitar"
                      >
                        <Power size={18} />
                      </button>
                    )}

                    <button
                      onClick={() => resetStats(provider.id)}
                      className="p-2 hover:bg-yellow-50 rounded-lg transition-colors text-yellow-600"
                      title="Resetar Stats"
                    >
                      <RotateCcw size={18} />
                    </button>

                    <button
                      onClick={() => removeProvider(provider.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                      title="Remover"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {provider.stats.lastError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Último erro:</strong> {provider.stats.lastError}
                  </div>
                )}
              </div>
            );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Configurações de Design da Alfa Contabilidade
 * Baseado nas diretrizes de padronização fornecidas
 */

export interface DesignConfig {
  // Configurações gerais
  logo: {
    url: string; // URL ou path do logo
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    size: 'small' | 'medium' | 'large';
    visibleOnAllSlides: boolean;
  };
  
  footer: {
    text: string;
    fontSize: 'xs' | 'sm' | 'md';
    position: 'bottom-center' | 'bottom-left' | 'bottom-right';
  };
  
  // Paleta de cores
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    alert: {
      red: string;
      yellow: string;
    };
  };
  
  // Moods de design
  moods: {
    alerta: {
      name: 'ALERTA URGENTE';
      emoji: '🚨';
      colors: string[];
      icons: string[];
      description: string;
    };
    estrategico: {
      name: 'ESTRATÉGICO & EDUCATIVO';
      emoji: '💡';
      colors: string[];
      icons: string[];
      description: string;
    };
    comunicado: {
      name: 'COMUNICADO & INFORMATIVO';
      emoji: '✨';
      colors: string[];
      icons: string[];
      description: string;
    };
  };
  
  // Biblioteca de ícones
  icons: {
    style: 'line' | 'filled' | 'duotone';
    colorMode: 'monochrome' | 'colored';
    library: Record<string, string>;
  };
  
  // Tipografia
  typography: {
    title: {
      fontFamily: string;
      fontWeight: string;
      fontSize: string;
      textTransform: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
    };
    subtitle: {
      fontFamily: string;
      fontWeight: string;
      fontSize: string;
    };
    body: {
      fontFamily: string;
      fontWeight: string;
      fontSize: string;
    };
    footer: {
      fontFamily: string;
      fontWeight: string;
      fontSize: string;
    };
  };
  
  // Estrutura de slides
  slideStructure: {
    cover: {
      elements: string[];
      layout: string;
    };
    content: {
      formats: string[];
      maxPoints: number;
    };
    cta: {
      elements: string[];
      buttonStyle: string;
    };
  };
}

export const ALFA_CONTABILIDADE_CONFIG: DesignConfig = {
  logo: {
    url: '/assets/logo-alfa-contabilidade.png',
    position: 'top-right',
    size: 'medium',
    visibleOnAllSlides: true,
  },
  
  footer: {
    text: 'Conteúdo completo em AlfaContabilidadeCariri.com.br',
    fontSize: 'xs',
    position: 'bottom-center',
  },
  
  colors: {
    primary: '#1E3A8A', // Azul escuro
    secondary: '#3B82F6', // Azul médio
    accent: '#60A5FA', // Azul claro
    text: '#1F2937', // Cinza escuro
    background: '#FFFFFF',
    alert: {
      red: '#DC2626',
      yellow: '#F59E0B',
    },
  },
  
  moods: {
    alerta: {
      name: 'ALERTA URGENTE',
      emoji: '🚨',
      colors: ['#DC2626', '#F59E0B', '#1E3A8A'],
      icons: ['⚠️', '🚨', '🗓️', '❌', '🛑', '⏰'],
      description: 'Prazos finais, mudanças de lei obrigatórias, alertas de golpes',
    },
    estrategico: {
      name: 'ESTRATÉGICO & EDUCATIVO',
      emoji: '💡',
      colors: ['#1E3A8A', '#3B82F6', '#F59E0B'],
      icons: ['📈', '💡', '🛡️', '⚖️', '🎯', '🔗'],
      description: 'Análise de oportunidades fiscais, dicas de gestão, temas complexos',
    },
    comunicado: {
      name: 'COMUNICADO & INFORMATIVO',
      emoji: '✨',
      colors: ['#1E3A8A', '#60A5FA', '#9CA3AF'],
      icons: ['🗓️', '✨', '🌿', '☕'],
      description: 'Recessos, boas-vindas, mensagens institucionais',
    },
  },
  
  icons: {
    style: 'line',
    colorMode: 'monochrome',
    library: {
      checklist: '✓',
      warning: '⚠️',
      calendar: '🗓️',
      money: '💰',
      document: '📄',
      chart: '📊',
      shield: '🛡️',
      target: '🎯',
      lightbulb: '💡',
      scale: '⚖️',
    },
  },
  
  typography: {
    title: {
      fontFamily: 'sans-serif',
      fontWeight: 'extra-bold',
      fontSize: '3xl',
      textTransform: 'uppercase',
    },
    subtitle: {
      fontFamily: 'sans-serif',
      fontWeight: 'medium',
      fontSize: 'lg',
    },
    body: {
      fontFamily: 'sans-serif',
      fontWeight: 'regular',
      fontSize: 'sm',
    },
    footer: {
      fontFamily: 'sans-serif',
      fontWeight: 'light',
      fontSize: 'xs',
    },
  },
  
  slideStructure: {
    cover: {
      elements: [
        'Título Principal Impactante (caixa alta, maior informação)',
        'Subtítulo Explicativo (contextualiza)',
        'Destaque Visual (selo, ícone ou faixa colorida)',
        'CTA Visual (ícone "arraste para o lado")',
      ],
      layout: 'centered',
    },
    content: {
      formats: [
        'Checklists',
        'Comparações (Antes vs. Depois, Certo ✔️ vs. Errado ❌)',
        'Infográficos Simples (fluxogramas)',
        'Listas com Ícones (3-4 pontos chave)',
      ],
      maxPoints: 4,
    },
    cta: {
      elements: [
        'Título de Posicionamento',
        'Bullet points do nosso papel',
        'Logo em Destaque',
        'CTA Principal (botão destacado)',
      ],
      buttonStyle: 'destacado com cor primária',
    },
  },
};

export default ALFA_CONTABILIDADE_CONFIG;

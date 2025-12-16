
import { ClientDBRow, Dorama, AppCredentialDBRow } from './types';

// Mock data matching the 'clients' table structure in Supabase
// Usado apenas como fallback caso a conexão com Supabase falhe ou não esteja configurada
export const MOCK_DB_CLIENTS: ClientDBRow[] = [
  {
    id: '1',
    phone_number: '11999999999',
    purchase_date: '2024-02-15', 
    duration_months: 12,
    subscriptions: ['Viki Pass', 'Kocowa+'],
    is_debtor: false,
    is_contacted: true,
    deleted: false,
    created_at: '2024-02-15T10:00:00Z',
    client_name: 'Usuário Demo 1'
  },
  {
    id: '2',
    phone_number: '21988888888',
    purchase_date: '2023-01-10',
    duration_months: 12,
    subscriptions: ['Viki Pass'],
    is_debtor: true,
    is_contacted: false,
    deleted: false,
    created_at: '2023-01-10T10:00:00Z',
    client_name: 'Usuário Demo 2'
  }
];

export const MOCK_CREDENTIALS: AppCredentialDBRow[] = [
    {
        id: 'mock-1',
        service: 'Viki Pass',
        email: 'viki.demo@eudorama.com',
        password: 'senha_viki_demo',
        published_at: new Date().toISOString(),
        is_visible: true,
        created_at: new Date().toISOString()
    },
    {
        id: 'mock-2',
        service: 'Kocowa+',
        email: 'kocowa.demo@eudorama.com',
        password: 'senha_kocowa',
        published_at: new Date().toISOString(),
        is_visible: true,
        created_at: new Date().toISOString()
    },
    {
        id: 'mock-3',
        service: 'IQIYI',
        email: 'iqiyi.demo@eudorama.com',
        password: 'senha_iqiyi',
        published_at: new Date().toISOString(),
        is_visible: true,
        created_at: new Date().toISOString()
    },
    {
        id: 'mock-4',
        service: 'WeTV',
        email: 'wetv.demo@eudorama.com',
        password: 'senha_wetv',
        published_at: new Date().toISOString(),
        is_visible: true,
        created_at: new Date().toISOString()
    },
    {
        id: 'mock-5',
        service: 'DramaBox',
        email: 'dramabox.demo@eudorama.com',
        password: 'senha_dramabox',
        published_at: new Date().toISOString(),
        is_visible: true,
        created_at: new Date().toISOString()
    }
];

export const LOGIN_HELP_TIPS = [
  {
    app: 'Rakuten Viki',
    steps: [
      'Abra o aplicativo Viki.',
      'Clique em "Entrar" no canto superior direito.',
      'Escolha "Continuar com Email" se sua conta for vinculada ao email.',
      'Se esqueceu a senha, clique em "Esqueceu a senha?" para receber um link de redefinição.'
    ]
  },
  {
    app: 'Kocowa',
    steps: [
      'Acesse o site ou app Kocowa.',
      'Vá em "Log In".',
      'Certifique-se de não estar logado com uma conta Google errada.',
      'Verifique se sua assinatura está ativa no painel "My Account".'
    ]
  },
  {
    app: 'WeTV',
    steps: [
      'Abra o WeTV.',
      'Clique em "Eu" ou "Me" no canto inferior.',
      'Clique na foto de perfil para fazer login.',
      'Use a opção de login vinculada (Email/Social) correta.'
    ]
  },
  {
    app: 'IQIYI',
    steps: [
      'Abra o app IQIYI.',
      'Vá na aba "Eu" no canto inferior direito.',
      'Toque em "Faça Login/Cadastre-se".',
      'Verifique se está na região correta (Brasil).'
    ]
  },
  {
    app: 'DramaBox',
    steps: [
      'Abra o DramaBox.',
      'Vá em Perfil/Profile.',
      'Verifique se suas moedas/assinatura aparecem.',
      'Se sumiu, tente "Restaurar Compras" ou relogar.'
    ]
  }
];

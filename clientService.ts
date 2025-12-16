
import { createClient } from '@supabase/supabase-js';
import { User, ClientDBRow, Dorama, AdminUserDBRow, SubscriptionDetail } from '../types';
import { MOCK_DB_CLIENTS } from '../constants';

// --- CONFIGURAÇÃO DO SUPABASE ---
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://srsqipevsammsfzyaewn.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyc3FpcGV2c2FtbXNmenlhZXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMTA0NTQsImV4cCI6MjA4MDU4NjQ1NH0.8ePfpnSVeluDG-YwvrjWiIhl6fr5p6UDoZKjF7rrL1I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- GERENCIAMENTO DE DADOS LOCAIS ---
const getLocalUserData = (phoneNumber: string) => {
  try {
    const data = localStorage.getItem(`dorama_user_${phoneNumber}`);
    return data ? JSON.parse(data) : { watching: [], favorites: [], completed: [] };
  } catch (e) {
    return { watching: [], favorites: [], completed: [] };
  }
};

export const addLocalDorama = (phoneNumber: string, type: 'watching' | 'favorites' | 'completed', dorama: Dorama) => {
  const currentData = getLocalUserData(phoneNumber);
  
  if (!currentData[type]) {
    currentData[type] = [];
  }

  currentData[type].push(dorama);
  localStorage.setItem(`dorama_user_${phoneNumber}`, JSON.stringify(currentData));
  return currentData;
};

// --- FUNÇÕES DE CLIENTE ---

/**
 * Busca TODOS os clientes (necessário para o algoritmo de distribuição de senhas e painel admin)
 */
export const getAllClients = async (): Promise<ClientDBRow[]> => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('clients')
        .select('*');
      
      if (!error && data) return data as unknown as ClientDBRow[];
    }
    return MOCK_DB_CLIENTS;
  } catch (e) {
    return MOCK_DB_CLIENTS;
  }
};

export const getTestUser = async (): Promise<{ user: User | null, error: string | null }> => {
    try {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('phone_number', '00000000000');
        
        if (!data || data.length === 0) return { user: null, error: 'Usuário de teste não configurado.' };
        
        return processUserLogin(data as unknown as ClientDBRow[]);
    } catch (e) {
        return { user: null, error: 'Erro de conexão.' };
    }
};

/**
 * Verifica se o usuário existe e se já tem senha configurada.
 */
export const checkUserStatus = async (lastFourDigits: string): Promise<{ 
  exists: boolean; 
  hasPassword: boolean; 
  phoneMatches: string[] 
}> => {
  try {
    if (!supabase) return { exists: false, hasPassword: false, phoneMatches: [] };

    const { data, error } = await supabase
      .from('clients')
      .select('phone_number, client_password, deleted')
      .like('phone_number', `%${lastFourDigits}`);

    if (error || !data || data.length === 0) {
      // Fallback Mock
      const foundMock = MOCK_DB_CLIENTS.filter(c => c.phone_number.endsWith(lastFourDigits));
      if (foundMock.length > 0) {
         if (foundMock[0].deleted) return { exists: false, hasPassword: false, phoneMatches: [] };
         return { exists: true, hasPassword: false, phoneMatches: [foundMock[0].phone_number] };
      }
      return { exists: false, hasPassword: false, phoneMatches: [] };
    }

    // Filtra usuários excluídos
    const activeClients = (data as any[]).filter(c => !c.deleted);

    if (activeClients.length === 0) {
       return { exists: false, hasPassword: false, phoneMatches: [] };
    }

    // Verifica se algum registro retornado já tem senha
    const hasPass = activeClients.some(row => row.client_password && row.client_password.trim() !== '');
    const phones = Array.from(new Set(activeClients.map(d => d.phone_number as string)));

    return { exists: true, hasPassword: hasPass, phoneMatches: phones };

  } catch (e) {
    console.error(e);
    return { exists: false, hasPassword: false, phoneMatches: [] };
  }
};

/**
 * Registra a senha para todos os registros vinculados a aquele número de telefone
 */
export const registerClientPassword = async (phoneNumber: string, password: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({ client_password: password })
      .eq('phone_number', phoneNumber)
      .select();

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn("Nenhum registro atualizado. Verifique RLS ou número de telefone.");
      return false;
    }

    return true;
  } catch (e) {
    console.error('Erro ao salvar senha', e);
    return false;
  }
};

/**
 * Tenta fazer login validando a senha
 */
export const loginWithPassword = async (phoneNumber: string, password: string): Promise<{ user: User | null, error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('phone_number', phoneNumber);

    if (error || !data || data.length === 0) {
      return { user: null, error: 'Usuário não encontrado.' };
    }

    // Verifica senha
    const clientData = data[0] as unknown as ClientDBRow;
    
    // Verifica se foi deletado
    if (clientData.deleted) {
      return { user: null, error: 'Acesso revogado. Entre em contato com o suporte.' };
    }

    // Comparação simples
    if (String(clientData.client_password).trim() !== String(password).trim()) {
      return { user: null, error: 'Senha incorreta.' };
    }

    return processUserLogin(data as unknown as ClientDBRow[]);

  } catch (e) {
    return { user: null, error: 'Erro de conexão.' };
  }
};

// Auxiliar para processar os dados brutos e retornar o objeto User
export const processUserLogin = (userRows: ClientDBRow[]): { user: User | null, error: string | null } => {
    if (userRows.length === 0) return { user: null, error: 'Dados vazios.' };

    const primaryPhone = userRows[0].phone_number;
    const allServices = new Set<string>();
    const subscriptionMap: Record<string, SubscriptionDetail> = {};
    let bestRow = userRows[0];
    let maxExpiryTime = 0;
    let isDebtorAny = false;
    let overrideAny = false;

    // Verificar se a melhor conta (mais recente) está deletada
    const hasActiveAccount = userRows.some(row => !row.deleted);
    if (!hasActiveAccount) {
        return { user: null, error: 'Sua conta foi desativada.' };
    }

    userRows.forEach(row => {
      if (row.deleted) return; // Pula registros deletados no processamento

      let subs: string[] = [];
      if (Array.isArray(row.subscriptions)) {
        subs = row.subscriptions;
      } else if (typeof row.subscriptions === 'string') {
        const s = row.subscriptions as string;
        if (s.includes('+')) {
           subs = s.split('+').map(i => i.trim().replace(/^"|"$/g, ''));
        } else {
           subs = [s.replace(/^"|"$/g, '')];
        }
      }
      
      subs.forEach(s => {
          if (s) {
              const cleanService = s.split('|')[0].trim();
              allServices.add(cleanService);
              
              subscriptionMap[cleanService] = {
                  purchaseDate: row.purchase_date,
                  durationMonths: row.duration_months,
                  isDebtor: row.is_debtor
              };
          }
      });

      if (row.is_debtor) isDebtorAny = true;
      if (row.override_expiration) overrideAny = true;

      const purchase = new Date(row.purchase_date);
      const expiry = new Date(purchase);
      expiry.setMonth(purchase.getMonth() + row.duration_months);

      if (expiry.getTime() > maxExpiryTime) {
        maxExpiryTime = expiry.getTime();
        bestRow = row;
      }
    });

    const combinedServices = Array.from(allServices);
    const localData = getLocalUserData(primaryPhone);
    const gameProgress = bestRow.game_progress || {};

    const appUser: User = {
      id: bestRow.id,
      name: "Dorameira", 
      phoneNumber: bestRow.phone_number,
      purchaseDate: bestRow.purchase_date, 
      durationMonths: bestRow.duration_months,
      subscriptionDetails: subscriptionMap,
      services: combinedServices,
      isDebtor: isDebtorAny,
      overrideExpiration: overrideAny,
      watching: localData.watching || [],
      favorites: localData.favorites || [],
      completed: localData.completed || [],
      gameProgress: gameProgress
    };

    return { user: appUser, error: null };
};

/**
 * DEPRECATED BUT KEPT FOR MOCK: Login antigo direto (usado apenas se o DB falhar ou para o mock)
 */
export const loginUserByPhone = async (lastFourDigits: string): Promise<{ user: User | null, error: string | null }> => {
  const found = MOCK_DB_CLIENTS.filter(c => c.phone_number.endsWith(lastFourDigits) && !c.deleted);
  if (found.length > 0) return processUserLogin(found);
  return { user: null, error: 'Cliente não encontrado.' };
};

// --- ADMIN AUTH (REAL via Supabase) ---
export const verifyAdminLogin = async (login: string, pass: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', login)
      .limit(1);

    if (error || !data || data.length === 0) {
      return false;
    }

    const admin = data[0] as AdminUserDBRow;
    return admin.password === pass;
  } catch (e) {
    console.error('Erro ao verificar admin:', e);
    return false;
  }
};

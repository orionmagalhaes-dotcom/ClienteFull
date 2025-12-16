
import { createClient } from '@supabase/supabase-js';
import { User, ClientDBRow, Dorama, SubscriptionDetail } from '../types';
import { MOCK_DB_CLIENTS } from '../constants';

// --- CONFIGURAÇÃO DO SUPABASE ---
// URL e Chave fornecidas pelo usuário
const SUPABASE_URL = 'https://mhiormzpctfoyjbrmxfz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaW9ybXpwY3Rmb3lqYnJteGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTkwNjUsImV4cCI6MjA4MTQzNTA2NX0.y5rfFm0XHsieEZ2fCDH6tq5sZI7mqo8V_tYbbkKWroQ'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- DORAMA LIST MANAGEMENT (SUPABASE) ---

export const getUserDoramasFromDB = async (phoneNumber: string): Promise<{ watching: Dorama[], favorites: Dorama[], completed: Dorama[] }> => {
    try {
        const { data, error } = await supabase
            .from('doramas')
            .select('*')
            .eq('phone_number', phoneNumber);

        if (error || !data) {
            console.error("Erro ao buscar doramas:", error);
            return { watching: [], favorites: [], completed: [] };
        }

        // Mapeia snake_case do banco para camelCase do front
        const mappedData = data.map((d: any) => ({
            id: d.id,
            title: d.title,
            genre: d.genre,
            thumbnail: d.thumbnail,
            status: d.status,
            episodesWatched: d.episodes_watched,
            totalEpisodes: d.total_episodes,
            season: d.season,
            rating: d.rating,
            list_type: d.list_type
        }));

        const watching = mappedData.filter((d: any) => d.list_type === 'watching');
        const favorites = mappedData.filter((d: any) => d.list_type === 'favorites');
        const completed = mappedData.filter((d: any) => d.list_type === 'completed');

        return { watching, favorites, completed };
    } catch (e) {
        return { watching: [], favorites: [], completed: [] };
    }
};

export const addDoramaToDB = async (phoneNumber: string, listType: string, dorama: Dorama): Promise<Dorama | null> => {
    try {
        // Remove se já existir para evitar duplicatas
        await supabase
            .from('doramas')
            .delete()
            .eq('phone_number', phoneNumber)
            .eq('title', dorama.title);

        const newEntry = {
            id: dorama.id || crypto.randomUUID(),
            phone_number: phoneNumber,
            list_type: listType,
            title: dorama.title,
            thumbnail: dorama.thumbnail,
            genre: dorama.genre,
            status: dorama.status,
            episodes_watched: dorama.episodesWatched || 0,
            total_episodes: dorama.totalEpisodes || 16,
            season: dorama.season || 1,
            rating: dorama.rating || 0
        };

        const { data, error } = await supabase
            .from('doramas')
            .insert([newEntry])
            .select()
            .single();

        if (error) {
            console.error("Erro ao adicionar dorama:", error);
            return null;
        }
        
        return {
            ...dorama,
            id: data.id 
        };
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const updateDoramaInDB = async (dorama: Dorama): Promise<boolean> => {
    try {
        const updates = {
            episodes_watched: dorama.episodesWatched,
            total_episodes: dorama.totalEpisodes,
            season: dorama.season,
            rating: dorama.rating,
            status: dorama.status,
            list_type: dorama.status === 'Completed' ? 'completed' : (dorama.status === 'Plan to Watch' ? 'favorites' : 'watching')
        };

        const { error } = await supabase
            .from('doramas')
            .update(updates)
            .eq('id', dorama.id);

        return !error;
    } catch (e) {
        return false;
    }
};

export const removeDoramaFromDB = async (doramaId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('doramas')
            .delete()
            .eq('id', doramaId);
        return !error;
    } catch (e) {
        return false;
    }
};

// --- CLIENT AUTH & DATA (SUPABASE) ---

export const getAllClients = async (): Promise<ClientDBRow[]> => {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) {
        console.error("Erro ao buscar clientes:", error);
        return [];
    }
    return (data as unknown as ClientDBRow[]) || [];
};

export const checkUserStatus = async (lastFourDigits: string): Promise<{ 
  exists: boolean; 
  matches: { phoneNumber: string; hasPassword: boolean; name?: string; photo?: string }[] 
}> => {
    try {
        const { data, error } = await supabase
            .from('clients')
            .select('phone_number, client_password, client_name, profile_image, deleted')
            .ilike('phone_number', `%${lastFourDigits}`)
            .eq('deleted', false);

        if (error || !data || data.length === 0) {
            return { exists: false, matches: [] };
        }

        const matches = data.map((c: any) => ({
            phoneNumber: c.phone_number,
            hasPassword: !!c.client_password,
            name: c.client_name,
            photo: c.profile_image
        }));

        return { exists: true, matches };
    } catch (e) {
        return { exists: false, matches: [] };
    }
};

export const loginWithPassword = async (phoneNumber: string, password: string): Promise<{ user: User | null, error: string | null }> => {
    try {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('phone_number', phoneNumber);

        if (error || !data || data.length === 0) {
            return { user: null, error: 'Usuário não encontrado.' };
        }

        const mainClient = data.find((c: any) => !c.deleted) || data[0];

        if (mainClient.deleted) {
            return { user: null, error: 'Acesso revogado.' };
        }

        if (String(mainClient.client_password).trim() !== String(password).trim()) {
            return { user: null, error: 'Senha incorreta.' };
        }

        return processUserLogin(data as unknown as ClientDBRow[]);
    } catch (e) {
        return { user: null, error: 'Erro de conexão.' };
    }
};

export const registerClientPassword = async (phoneNumber: string, password: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('clients')
            .update({ client_password: password })
            .eq('phone_number', phoneNumber);
        return !error;
    } catch (e) {
        return false;
    }
};

export const processUserLogin = async (userRows: ClientDBRow[]): Promise<{ user: User | null, error: string | null }> => {
    if (userRows.length === 0) return { user: null, error: 'Dados vazios.' };

    const primaryPhone = userRows[0].phone_number;
    const allServices = new Set<string>();
    const subscriptionMap: Record<string, SubscriptionDetail> = {};
    let bestRow = userRows[0];
    let maxExpiryTime = 0;
    let isDebtorAny = false;
    let overrideAny = false;

    const hasActiveAccount = userRows.some(row => !row.deleted);
    if (!hasActiveAccount) {
        return { user: null, error: 'Sua conta foi desativada.' };
    }

    userRows.forEach(row => {
      if (row.deleted) return; 

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
              if (cleanService) {
                  allServices.add(cleanService);
                  subscriptionMap[cleanService] = {
                      purchaseDate: row.purchase_date,
                      durationMonths: row.duration_months,
                      isDebtor: row.is_debtor
                  };
              }
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
    
    // Busca dados ricos (Doramas, Jogos) do Supabase
    const doramaData = await getUserDoramasFromDB(primaryPhone);
    const gameProgress = bestRow.game_progress || {};

    const appUser: User = {
      id: bestRow.id,
      name: bestRow.client_name || "Dorameira", 
      phoneNumber: bestRow.phone_number,
      purchaseDate: bestRow.purchase_date, 
      durationMonths: bestRow.duration_months,
      subscriptionDetails: subscriptionMap,
      services: combinedServices,
      isDebtor: isDebtorAny,
      overrideExpiration: overrideAny,
      watching: doramaData.watching,
      favorites: doramaData.favorites,
      completed: doramaData.completed,
      gameProgress: gameProgress,
      themeColor: bestRow.theme_color,
      backgroundImage: bestRow.background_image,
      profileImage: bestRow.profile_image,
      manualCredentials: bestRow.manual_credentials
    };

    return { user: appUser, error: null };
};

export const processUserLoginSync = (userRows: ClientDBRow[]): { user: User | null, error: string | null } => {
    // Versão síncrona simplificada para uso em renderização de listas (AdminPanel)
    if (userRows.length === 0) return { user: null, error: 'Dados vazios.' };

    const primaryPhone = userRows[0].phone_number;
    const allServices = new Set<string>();
    const subscriptionMap: Record<string, SubscriptionDetail> = {};
    let bestRow = userRows[0];
    let maxExpiryTime = 0;
    let isDebtorAny = false;
    let overrideAny = false;

    const hasActiveAccount = userRows.some(row => !row.deleted);
    if (!hasActiveAccount) {
        return { user: null, error: 'Sua conta foi desativada.' };
    }

    userRows.forEach(row => {
      if (row.deleted) return;

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
              if (cleanService) {
                allServices.add(cleanService);
                subscriptionMap[cleanService] = {
                    purchaseDate: row.purchase_date,
                    durationMonths: row.duration_months,
                    isDebtor: row.is_debtor
                };
              }
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
    const gameProgress = bestRow.game_progress || {};

    const appUser: User = {
      id: bestRow.id,
      name: bestRow.client_name || "Dorameira",
      phoneNumber: bestRow.phone_number,
      purchaseDate: bestRow.purchase_date,
      durationMonths: bestRow.duration_months,
      subscriptionDetails: subscriptionMap,
      services: combinedServices,
      isDebtor: isDebtorAny,
      overrideExpiration: overrideAny,
      watching: [], // Em modo sync não carregamos doramas do DB
      favorites: [],
      completed: [],
      gameProgress: gameProgress,
      themeColor: bestRow.theme_color,
      backgroundImage: bestRow.background_image,
      profileImage: bestRow.profile_image,
      manualCredentials: bestRow.manual_credentials
    };

    return { user: appUser, error: null };
};

// --- DATA MODIFICATION (Admin & Client Actions) ---

export const saveClientToDB = async (client: Partial<ClientDBRow>): Promise<{ success: boolean; msg: string }> => {
    try {
        const payload = { ...client };
        
        // CORREÇÃO CRÍTICA: Se o ID for string vazia ou undefined, REMOVE a propriedade
        // Isso força o Postgres a gerar um novo UUID ao invés de tentar inserir '' (que é inválido)
        // Se o ID existir, o upsert fará o UPDATE corretamente
        if (!payload.id) {
            delete payload.id;
        }

        const { data, error } = await supabase
            .from('clients')
            .upsert(payload) // Supabase upsert lida com ID automaticamente se ele existir, se não, insere
            .select();

        if (error) throw error;
        return { success: true, msg: "Salvo com sucesso!" };
    } catch (e: any) {
        return { success: false, msg: `Erro Supabase: ${e.message}` };
    }
};

export const deleteClientFromDB = async (clientId: string): Promise<boolean> => {
    const { error } = await supabase.from('clients').update({ deleted: true }).eq('id', clientId);
    return !error;
};

export const restoreClient = async (clientId: string): Promise<boolean> => {
    const { error } = await supabase.from('clients').update({ deleted: false }).eq('id', clientId);
    return !error;
};

export const permanentlyDeleteClient = async (clientId: string): Promise<boolean> => {
    // Apaga clientes e doramas em cascata
    // Idealmente use Foreign Keys com Cascade no DB, mas aqui garantimos via código
    const { data: client } = await supabase.from('clients').select('phone_number').eq('id', clientId).single();
    if (client) {
        await supabase.from('doramas').delete().eq('phone_number', client.phone_number);
    }
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    return !error;
};

export const updateClientName = async (phoneNumber: string, newName: string): Promise<boolean> => {
    const { error } = await supabase
        .from('clients')
        .update({ client_name: newName })
        .eq('phone_number', phoneNumber);
    return !error;
};

export const updateClientPreferences = async (phoneNumber: string, preferences: { themeColor?: string, backgroundImage?: string, profileImage?: string }): Promise<boolean> => {
    // Converte camelCase para snake_case para o banco
    const updates: any = {};
    if (preferences.themeColor) updates.theme_color = preferences.themeColor;
    if (preferences.backgroundImage) updates.background_image = preferences.backgroundImage;
    if (preferences.profileImage) updates.profile_image = preferences.profileImage;

    const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('phone_number', phoneNumber);
    
    return !error;
};

export const saveGameProgress = async (phoneNumber: string, gameId: string, progressData: any) => {
    // Primeiro busca o progresso atual
    const { data } = await supabase.from('clients').select('game_progress').eq('phone_number', phoneNumber).single();
    const current = data?.game_progress || {};
    const updated = { ...current, [gameId]: progressData };
    
    await supabase
        .from('clients')
        .update({ game_progress: updated })
        .eq('phone_number', phoneNumber);
};

export const updateLastActive = async (phoneNumber: string): Promise<void> => {
    await supabase
        .from('clients')
        .update({ last_active_at: new Date().toISOString() })
        .eq('phone_number', phoneNumber);
};

export const refreshUserProfile = async (phoneNumber: string): Promise<{ user: User | null, error: string | null }> => {
    const { data } = await supabase.from('clients').select('*').eq('phone_number', phoneNumber);
    if (data && data.length > 0) return processUserLogin(data as unknown as ClientDBRow[]);
    return { user: null, error: 'Erro ao sincronizar.' };
};

// --- DANGER ZONE (SUPABASE IMPLEMENTATION) ---

export const hardDeleteAllClients = async (): Promise<{success: boolean, msg: string}> => {
    // Apaga TODOS os registros (exceto se tiver restrição de FK, mas doramas são deletados antes se não tiver cascade)
    // Filtro: "id não é um UUID zerado (impossível)" = Seleciona todos os ids válidos
    const { error } = await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (!error) {
        // Tenta apagar doramas órfãos também
        await supabase.from('doramas').delete().neq('id', '0');
    } else {
        return { success: false, msg: error.message };
    }
    return { success: true, msg: "Todos os clientes deletados." };
};

export const resetAllClientPasswords = async (): Promise<{success: boolean, msg: string}> => {
    // Reseta senha de todos que tem ID válido (todos)
    const { error } = await supabase
        .from('clients')
        .update({ client_password: '' })
        .neq('id', '00000000-0000-0000-0000-000000000000') 
        .neq('phone_number', '00000000000'); // Preserva conta de teste
        
    if (error) return { success: false, msg: error.message };
    return { success: true, msg: "Senhas resetadas." };
};

export const resetAllNamesAndFixDates = async (): Promise<{success: boolean, msg: string}> => {
    const { error: nameError } = await supabase
        .from('clients')
        .update({ client_name: '' })
        .neq('id', '00000000-0000-0000-0000-000000000000') 
        .neq('phone_number', '00000000000');
    
    if (nameError) return { success: false, msg: `Erro: ${nameError.message}` };
    return { success: true, msg: "Manutenção concluída! Nomes resetados no servidor." };
};

export const deleteAllClients = async (): Promise<{success: boolean, msg: string}> => {
    // Soft Delete All
    const { error } = await supabase.from('clients').update({ deleted: true }).neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) return { success: false, msg: error.message };
    return { success: true, msg: "Todos movidos para lixeira." };
};

export const deleteSubscriptionsByService = async (serviceName: string): Promise<{ success: boolean; count: number }> => {
    const { data: clients } = await supabase.from('clients').select('id, subscriptions');
    if (!clients) return { success: false, count: 0 };

    let count = 0;
    for (const client of clients) {
        const subs = Array.isArray(client.subscriptions) ? client.subscriptions : [];
        const newSubs = subs.filter((s: string) => !s.toLowerCase().includes(serviceName.toLowerCase()));
        
        if (newSubs.length !== subs.length) {
            await supabase.from('clients').update({ subscriptions: newSubs }).eq('id', client.id);
            count++;
        }
    }
    return { success: true, count };
};

// --- LEGACY/UNUSED ---
export const getRotationalTestPassword = (): string => {
    const now = new Date();
    const seed = now.getUTCFullYear() * 10000 + now.getUTCMonth() * 100 + now.getUTCDate() * 10 + Math.floor(now.getUTCHours() / 3);
    const a = 1664525; const c = 1013904223; const m = 4294967296;
    let x = seed; x = (a * x + c) % m; x = (a * x + c) % m;
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let password = "";
    for (let i = 0; i < 4; i++) { x = (a * x + c) % m; password += chars.charAt(Math.abs(x) % chars.length); }
    return password;
};

// --- SYSTEM CONFIG ---
export const getSystemConfig = async () => {
    const { data } = await supabase.from('system_config').select('*').single();
    if (data) {
        // Map snake_case DB columns to camelCase App object
        return {
            bannerText: data.banner_text,
            bannerType: data.banner_type,
            bannerActive: data.banner_active,
            serviceStatus: data.service_status
        };
    }
    return null;
};

export const saveSystemConfig = async (config: any): Promise<boolean> => {
    // Map camelCase App object to snake_case DB columns
    const payload = {
        id: 1,
        banner_text: config.bannerText,
        banner_type: config.bannerType,
        banner_active: config.bannerActive,
        service_status: config.serviceStatus
    };
    
    const { error } = await supabase.from('system_config').upsert(payload);
    return !error;
};

// Admin auth Local
export const verifyAdminLogin = async (login: string, pass: string): Promise<boolean> => {
    // Check against local storage or default
    const storedPass = localStorage.getItem('eudorama_admin_pass');
    const validPass = storedPass || 'admin123';
    
    if (login === 'admin' && pass === validPass) return true;
    return false;
};

export const updateAdminPassword = async (newPassword: string): Promise<boolean> => {
    localStorage.setItem('eudorama_admin_pass', newPassword);
    return true;
};

export const createDemoClient = async (): Promise<boolean> => { 
    // Gera um número único 999... baseado no tempo para evitar conflito
    const uniqueSuffix = Date.now().toString().slice(-8);
    const demoPhone = `999${uniqueSuffix}`;
    
    const payload: Partial<ClientDBRow> = {
        phone_number: demoPhone,
        client_name: 'Cliente Demo',
        client_password: 'demo',
        purchase_date: new Date().toISOString(),
        duration_months: 1,
        subscriptions: ['Viki Pass'],
        is_debtor: false,
        deleted: false,
        created_at: new Date().toISOString()
    };
    
    const res = await saveClientToDB(payload);
    return res.success;
} 

export const addLocalDorama = (phoneNumber: string, listType: any, dorama: any) => {}; 
export const syncDoramaBackup = (phoneNumber: string, data: any) => {};

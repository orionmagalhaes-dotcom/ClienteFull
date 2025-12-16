
import { AppCredential, User, ClientDBRow } from '../types';
import { getAllClients, supabase } from './clientService';
import { MOCK_CREDENTIALS } from '../constants';

export const fetchCredentials = async (): Promise<AppCredential[]> => {
    try {
        const { data, error } = await supabase
            .from('credentials')
            .select('*');
        
        if (error) {
            console.error("Erro ao buscar credenciais:", error.message);
            return [];
        }
        if (!data) return [];

        // Mapeia snake_case (DB) para camelCase (App)
        return data.map((row: any) => ({
            id: row.id,
            service: row.service,
            email: row.email,
            password: row.password,
            publishedAt: row.published_at,
            isVisible: row.is_visible
        }));
    } catch (e) {
        console.error("Exceção ao buscar credenciais:", e);
        return [];
    }
};

export const saveCredential = async (cred: AppCredential): Promise<string | null> => {
    try {
        // Mapeia camelCase (App) para snake_case (DB)
        const payload: any = {
            service: cred.service,
            email: cred.email,
            password: cred.password,
            published_at: cred.publishedAt,
            is_visible: cred.isVisible
        };

        // Só inclui o ID se ele existir e não for vazio (Edição)
        // Se for criação, deixa o Supabase gerar o UUID
        if (cred.id && cred.id.trim() !== '') {
            payload.id = cred.id;
        }

        const { data, error } = await supabase
            .from('credentials')
            .upsert(payload)
            .select()
            .single();

        if (error) {
            console.error("Erro ao salvar credencial:", JSON.stringify(error, null, 2));
            return null;
        }
        return data.id;
    } catch (e: any) {
        console.error("Exceção ao salvar credencial:", e.message || e);
        return null;
    }
};

export const deleteCredential = async (id: string): Promise<void> => {
    const { error } = await supabase.from('credentials').delete().eq('id', id);
    if (error) {
        console.error("Erro ao deletar credencial:", error.message);
    }
};

// --- LÓGICA DE DISTRIBUIÇÃO REVISADA ---

const getDistributionStrategy = (serviceName: string) => {
    const s = serviceName.toLowerCase();
    
    // REGRAS DEFINIDAS:
    // Viki Pass: Máximo 4 clientes por conta.
    if (s.includes('viki')) return { type: 'bucket', limit: 4 };
    
    // Kocowa: Máximo 5 clientes por conta.
    if (s.includes('kocowa')) return { type: 'bucket', limit: 5 }; 
    
    // IQIYI: Distribuído igualitariamente (Round Robin).
    if (s.includes('iqiyi')) return { type: 'round_robin' };
    
    // WeTV: Todos acessam o mesmo email (Single).
    if (s.includes('wetv')) return { type: 'single' };
    
    // Padrão (DramaBox e outros): Bucket genérico de 5
    return { type: 'bucket', limit: 5 };
};

export const getAssignedCredential = async (user: User, serviceName: string, preloadedClients?: ClientDBRow[]): Promise<{ credential: AppCredential | null, alert: string | null, daysActive: number }> => {
  
  // Modo Demo / Teste
  if (user.phoneNumber === '00000000000' || user.phoneNumber.startsWith('99999')) {
      const cleanName = serviceName.split('|')[0].trim();
      const safeServiceName = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
      return {
          credential: {
              id: 'demo-safe-cred',
              service: cleanName,
              email: `demo.${safeServiceName}@eudorama.com`,
              password: 'senha_demo_protegida',
              publishedAt: new Date().toISOString(),
              isVisible: true
          },
          alert: "Modo Demo: Dados Fictícios (Segurança)",
          daysActive: 1
      };
  }

  const credentialsList = await fetchCredentials();
  
  // 1. Verifica credenciais manuais (Override)
  if (user.manualCredentials) {
      const cleanService = serviceName.split('|')[0].trim();
      const assignedId = user.manualCredentials[cleanService] || 
                         Object.entries(user.manualCredentials).find(([key]) => cleanService.toLowerCase().includes(key.toLowerCase()))?.[1];

      if (assignedId) {
          const manualCred = credentialsList.find(c => c.id === assignedId);
          if (manualCred) {
              return calculateAlerts(manualCred, serviceName);
          }
      }
  }

  // 2. Filtra credenciais disponíveis para o serviço
  const allCreds = credentialsList
    .filter(c => {
        if (!c.isVisible) return false;
        const dbService = c.service.toLowerCase();
        const userService = serviceName.toLowerCase();
        return dbService.includes(userService) || userService.includes(dbService);
    })
    // Ordena por data: mais antigas primeiro (estratégia padrão para encher buckets na ordem) ou mais novas?
    // Para 'bucket', a ordem é crucial. Vamos manter ordem de criação estável.
    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());

  if (allCreds.length === 0) return { credential: null, alert: "Nenhuma conta disponível. Contate o suporte.", daysActive: 0 };

  // 3. Busca todos os clientes que utilizam este serviço para calcular a posição do usuário atual
  const allClients = preloadedClients || await getAllClients();
  const activeClients = allClients.filter((c: any) => !c.deleted);
  
  const clientsWithService = activeClients.filter(client => {
    let subs: string[] = [];
    if (Array.isArray(client.subscriptions)) {
      subs = client.subscriptions;
    } else if (typeof client.subscriptions === 'string') {
      const s = client.subscriptions as string;
      subs = s.includes('+') ? s.split('+') : [s];
    }
    return subs.some(s => s.toLowerCase().includes(serviceName.toLowerCase()));
  });

  // Ordenação determinística dos clientes (ex: por telefone) para garantir que o userIndex seja estável
  clientsWithService.sort((a, b) => a.phone_number.localeCompare(b.phone_number));

  const userPhoneClean = user.phoneNumber.replace(/\D/g, '');
  const userIndex = clientsWithService.findIndex(c => c.phone_number.replace(/\D/g, '') === userPhoneClean);

  if (userIndex === -1) {
    // Fallback de segurança se usuário não for encontrado na lista (ex: recém criado)
    return calculateAlerts(allCreds[0], serviceName);
  }

  let assignedCred: AppCredential;
  let capacityAlert: string | null = null;
  
  const strategy = getDistributionStrategy(serviceName);

  if (strategy.type === 'single') {
      // WeTV: Todos na primeira conta (ou na única)
      assignedCred = allCreds[0];
  }
  else if (strategy.type === 'round_robin') {
      // IQIYI: Distribuição igualitária
      assignedCred = allCreds[userIndex % allCreds.length];
  }
  else { 
      // Viki (4) & Kocowa (5): Estratégia de Balde (Bucket)
      const limitPerAccount = strategy.limit || 5;
      const totalCapacity = allCreds.length * limitPerAccount;
      
      if (userIndex < totalCapacity) {
          // Usuário cabe dentro da capacidade atual
          // Ex: User 0-3 vai pra Conta 0, User 4-7 vai pra Conta 1 (Se limit=4)
          const credentialIndex = Math.floor(userIndex / limitPerAccount);
          assignedCred = allCreds[credentialIndex];
      } else {
          // OVERFLOW: Não há contas suficientes
          // Regra: "realocados para alguma conta aleatória" (usamos round-robin no overflow para balancear a sobrecarga)
          // Regra: "direcionados para a nova logo que for criada" (Automaticamente satisfeito pois quando nova conta é criada, 'totalCapacity' aumenta e o 'userIndex' cairá no bloco 'if' acima na próxima renderização)
          
          const fallbackIndex = userIndex % allCreds.length;
          assignedCred = allCreds[fallbackIndex];
          
          capacityAlert = `⚠️ SISTEMA LOTADO: Este login está compartilhado com excesso de pessoas. Crie uma nova conta ${serviceName} urgentemente!`;
      }
  }

  const result = calculateAlerts(assignedCred, serviceName);
  
  if (capacityAlert) {
      // Adiciona o alerta de capacidade ao alerta de validade (se houver)
      result.alert = result.alert ? `${capacityAlert} | ${result.alert}` : capacityAlert;
  }

  return result;
};

const calculateAlerts = (cred: AppCredential, serviceName: string) => {
  const dateCreated = new Date(cred.publishedAt);
  const today = new Date();

  const createdUTC = Date.UTC(dateCreated.getFullYear(), dateCreated.getMonth(), dateCreated.getDate());
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  
  const diffTime = todayUTC - createdUTC;
  const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  let alertMsg = null;
  const sName = serviceName.toLowerCase();

  if (sName.includes('viki')) {
      if (daysPassed >= 14) alertMsg = "⚠️ Conta Expirada (14 Dias). Aguarde nova!";
      else if (daysPassed === 13) alertMsg = "⚠️ Atenção: Último dia deste login!";
      else if (daysPassed >= 10) alertMsg = `⚠️ Ciclo final (${daysPassed}/14 dias).`;
  } 
  else if (sName.includes('kocowa')) {
      if (daysPassed >= 30) alertMsg = "⚠️ Conta Expirada. Aguarde nova!";
      else if (daysPassed >= 28) alertMsg = "⚠️ Atenção: A senha muda em breve!";
  }
  else if (sName.includes('iqiyi')) {
      if (daysPassed >= 29) alertMsg = "⚠️ Atualização de conta iminente.";
  }
  else if (daysPassed >= 35) {
      alertMsg = "⚠️ Login muito antigo.";
  }

  return { credential: cred, alert: alertMsg, daysActive: daysPassed };
};

// Utilizado no painel admin para mostrar quantos usuários estão em cada conta
export const getClientsAssignedToCredential = async (cred: AppCredential, preloadedClients?: any[]): Promise<ClientDBRow[]> => {
   const allClients = preloadedClients || await getAllClients();
   const credentials = await fetchCredentials();
   
   // Filtra apenas as credenciais DO MESMO SERVIÇO da credencial alvo
   const serviceCreds = credentials
       .filter(c => c.isVisible && c.service.toLowerCase() === cred.service.toLowerCase())
       .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());

   const credIndex = serviceCreds.findIndex(c => c.id === cred.id);
   if (credIndex === -1) return [];

   // Filtra clientes que têm esse serviço
   const eligibleClients = allClients
       .filter((c: any) => {
           if (c.deleted) return false;
           const sStr = Array.isArray(c.subscriptions) ? c.subscriptions.join(' ') : c.subscriptions;
           return sStr && sStr.toLowerCase().includes(cred.service.toLowerCase());
       })
       .sort((a, b) => a.phone_number.localeCompare(b.phone_number));

   const strategy = getDistributionStrategy(cred.service);
   const assignedClients: ClientDBRow[] = [];

   if (strategy.type === 'single') {
       if (credIndex === 0) return eligibleClients; // Todos na primeira
       return [];
   }

   if (strategy.type === 'round_robin') {
       // Filtra clientes cujo módulo bate com o índice desta conta
       return eligibleClients.filter((_, i) => i % serviceCreds.length === credIndex);
   }

   if (strategy.type === 'bucket') {
       const limit = strategy.limit || 5;
       const start = credIndex * limit;
       const end = start + limit;
       
       // Clientes normais dentro do limite
       const standardUsers = eligibleClients.slice(start, end);
       assignedClients.push(...standardUsers);

       // Clientes OVERFLOW (excesso)
       // Se o número de clientes for maior que a capacidade total de todas as contas
       const totalCapacity = serviceCreds.length * limit;
       if (eligibleClients.length > totalCapacity) {
           // Percorre os clientes que sobraram
           for (let i = totalCapacity; i < eligibleClients.length; i++) {
               // Distribui o excesso via round-robin nas contas existentes
               if (i % serviceCreds.length === credIndex) {
                   assignedClients.push(eligibleClients[i]);
               }
           }
       }
   }

   return assignedClients;
};

export const getUsersCountForCredential = async (cred: AppCredential, preloadedClients?: any[]): Promise<number> => {
    const users = await getClientsAssignedToCredential(cred, preloadedClients);
    return users.length;
};


import React, { useState, useEffect } from 'react';
import { AppCredential, ClientDBRow } from '../types';
import { fetchCredentials, saveCredential, deleteCredential, getUsersCountForCredential } from '../services/credentialService';
import { getAllClients, saveClientToDB, deleteClientFromDB, restoreClient, permanentlyDeleteClient, hardDeleteAllClients, resetAllClientPasswords, resetAllNamesAndFixDates } from '../services/clientService';
import { Plus, Trash2, Edit2, LogOut, Users, Search, AlertTriangle, X, ShieldAlert, Key, Activity, Clock, CheckCircle2, RefreshCw, ArrowDownUp, FileUp, Info, MessageCircle, Phone, DollarSign, TrendingDown, PieChart, BarChart, Loader2 } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

const SERVICES = ['Viki Pass', 'Kocowa+', 'IQIYI', 'WeTV', 'DramaBox'];

// PREÇOS BASE (Estimativa para cálculo financeiro)
const SERVICE_PRICES: Record<string, number> = {
    'Viki Pass': 19.90,
    'Kocowa+': 14.90,
    'IQIYI': 14.90,
    'WeTV': 14.90,
    'DramaBox': 14.90
};

// UTILS
const toLocalInput = (isoString: string) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '';
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().slice(0, 16);
    } catch(e) { return ''; }
};

const toDateInput = (isoString: string) => {
    if (!isoString) return new Date().toISOString().split('T')[0];
    try { return isoString.split('T')[0]; } catch(e) { return ''; }
};

const normalizeSubscriptions = (subs: string | string[]): string[] => {
    if (Array.isArray(subs)) return subs;
    if (typeof subs === 'string') {
        let cleaned = subs.replace(/^\{|\}$/g, '');
        if (!cleaned) return [];
        if (cleaned.includes(',')) return cleaned.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        if (cleaned.includes('+')) return cleaned.split('+').map(s => s.trim().replace(/^"|"$/g, ''));
        return [cleaned.trim().replace(/^"|"$/g, '')];
    }
    return [];
};

// LÓGICA DE STATUS DA CONTA (Renovação)
const getCredentialHealth = (service: string, publishedAt: string) => {
    const pubDate = new Date(publishedAt);
    const now = new Date();
    // Diferença em dias
    const diffTime = now.getTime() - pubDate.getTime();
    const daysActive = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let limit = 30; // Padrão
    const s = service.toLowerCase();

    if (s.includes('viki')) limit = 14;
    else if (s.includes('kocowa')) limit = 25;
    else if (s.includes('iqiyi')) limit = 30;
    else if (s.includes('wetv')) limit = 30;
    else if (s.includes('dramabox')) {
        return { status: 'infinite', label: 'Vitalício', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: <CheckCircle2 className="w-3 h-3"/> };
    }

    const daysRemaining = limit - daysActive;

    // Vencido
    if (daysRemaining < 0) {
        return { 
            status: 'expired', 
            label: `Venceu há ${Math.abs(daysRemaining)}d`, 
            color: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
            icon: <AlertTriangle className="w-3 h-3"/>
        };
    }
    
    // Vence Hoje
    if (daysRemaining === 0) {
        return { 
            status: 'expired', 
            label: 'Vence HOJE', 
            color: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
            icon: <AlertTriangle className="w-3 h-3"/>
        };
    }

    // Alerta (2 dias ou menos)
    if (daysRemaining <= 2) {
        return { 
            status: 'warning', 
            label: `Renovar em ${daysRemaining}d`, 
            color: 'bg-orange-100 text-orange-700 border-orange-200',
            icon: <Clock className="w-3 h-3"/>
        };
    }

    // OK
    return { 
        status: 'ok', 
        label: `${daysRemaining} dias rest.`, 
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: <CheckCircle2 className="w-3 h-3"/>
    };
};

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'clients' | 'financial' | 'danger'>('clients'); 
  const [clientSubTab, setClientSubTab] = useState<'all' | 'active' | 'expiring' | 'expired' | 'contacted' | 'trash'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  const [credentials, setCredentials] = useState<AppCredential[]>([]);
  const [clients, setClients] = useState<ClientDBRow[]>([]);
  const [financials, setFinancials] = useState<any[]>([]);
  const [credCounts, setCredCounts] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(false);
  const [savingClient, setSavingClient] = useState(false);

  // Search State
  const [clientSearch, setClientSearch] = useState('');

  // Credential State
  const [isEditingCred, setIsEditingCred] = useState(false);
  const [credSortOrder, setCredSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkService, setBulkService] = useState(SERVICES[0]);
  const [bulkText, setBulkText] = useState('');
  
  const [credForm, setCredForm] = useState<Partial<AppCredential>>({ service: SERVICES[0], email: '', password: '', isVisible: true, publishedAt: new Date().toISOString() });
  
  // Client Modal State
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [clientForm, setClientForm] = useState<Partial<ClientDBRow>>({
      phone_number: '', client_name: '', client_password: '', subscriptions: [], duration_months: 1, is_debtor: false, is_contacted: false, purchase_date: toLocalInput(new Date().toISOString()), manual_credentials: {}
  });
  const [newSubService, setNewSubService] = useState(SERVICES[0]);
  const [newSubDate, setNewSubDate] = useState(toDateInput(new Date().toISOString()));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const [creds, allClients] = await Promise.all([fetchCredentials(), getAllClients()]);
        setCredentials(creds.filter(c => c.service !== 'SYSTEM_CONFIG'));
        setClients(allClients);

        // Calculate Financials
        const stats: Record<string, { active: number, revenue: number, churn: number }> = {};
        
        SERVICES.forEach(s => stats[s] = { active: 0, revenue: 0, churn: 0 });

        allClients.forEach(c => {
            const subs = normalizeSubscriptions(c.subscriptions);
            subs.forEach(sub => {
                const serviceName = sub.split('|')[0];
                const cleanName = SERVICES.find(s => serviceName.toLowerCase().includes(s.toLowerCase().split(' ')[0])); // Match parcial
                
                if (cleanName && stats[cleanName]) {
                    if (c.deleted) {
                        stats[cleanName].churn += 1;
                    } else {
                        stats[cleanName].active += 1;
                        stats[cleanName].revenue += (SERVICE_PRICES[cleanName] || 14.90);
                    }
                }
            });
        });

        setFinancials(Object.entries(stats).map(([name, data]) => ({ name, ...data })));

        const newCounts: {[key: string]: number} = {};
        for (const cred of creds) {
            newCounts[cred.id] = await getUsersCountForCredential(cred, allClients);
        }
        setCredCounts(newCounts);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  // --- HELPER DE DATAS ---
  const calculateExpiry = (dateStr: string, months: number) => {
      const d = new Date(dateStr);
      d.setMonth(d.getMonth() + months);
      return d;
  };

  const getDaysRemaining = (expiryDate: Date) => {
      const now = new Date();
      return Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDaysActive = (publishedAt: string) => {
      const pub = new Date(publishedAt);
      const now = new Date();
      return Math.floor((now.getTime() - pub.getTime()) / (1000 * 60 * 60 * 24));
  };

  // --- LÓGICA DE ESCURECIMENTO DO NOME (Baseado em Tempo) ---
  const getCredentialNameStyle = (service: string, publishedAt: string) => {
      const days = getDaysActive(publishedAt);
      const isViki = service.toLowerCase().includes('viki');
      const maxDays = isViki ? 14 : 30;
      const percentage = Math.min(100, (days / maxDays) * 100);

      // Escurece conforme chega perto de 100%
      if (percentage < 25) return 'text-gray-300'; // Muito novo (Claro)
      if (percentage < 50) return 'text-gray-500'; // Médio
      if (percentage < 75) return 'text-gray-700'; // Escurecendo
      if (percentage < 90) return 'text-gray-900'; // Quase lá (Preto)
      return 'text-black font-black drop-shadow-sm'; // Vencendo/Vencido (Preto Forte)
  };

  // --- WHATSAPP HELPER INTELIGENTE ---
  const handleWhatsApp = (client: ClientDBRow) => {
      const subs = normalizeSubscriptions(client.subscriptions);
      const expiredServices: string[] = [];
      const expiringServices: string[] = [];

      subs.forEach(s => {
          const [name, dateStr] = s.split('|');
          const date = dateStr ? new Date(dateStr) : new Date(client.purchase_date);
          const exp = calculateExpiry(date.toISOString(), client.duration_months);
          const days = getDaysRemaining(exp);

          if (days < 0) expiredServices.push(name);
          else if (days <= 5) expiringServices.push(name);
      });

      let msg = `Olá ${client.client_name || 'Dorameira'}! Tudo bem? Passando para falar sobre sua assinatura da EuDorama.`;
      
      if (expiredServices.length > 0) {
          const list = expiredServices.join(', ');
          msg = `Olá ${client.client_name || ''}! Notamos que suas assinaturas **${list}** venceram. Gostaria de renovar para não perder o acesso?`;
      } else if (expiringServices.length > 0) {
          const list = expiringServices.join(', ');
          msg = `Oie ${client.client_name || ''}! Suas assinaturas **${list}** vencem em breve. Vamos renovar?`;
      }

      window.open(`https://wa.me/55${client.phone_number}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // --- ACTIONS ---
  const handleSaveCredential = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!credForm.email || !credForm.password) return;
      await saveCredential(credForm as AppCredential);
      setCredForm({ service: SERVICES[0], email: '', password: '', isVisible: true, publishedAt: new Date().toISOString() });
      setIsEditingCred(false);
      loadData();
  };

  const handleBulkImport = async () => {
      if (!bulkText.trim()) return alert("Cole os dados primeiro.");
      
      const lines = bulkText.split('\n');
      let count = 0;
      
      setLoading(true);
      for (const line of lines) {
          if (!line.trim()) continue;
          // Formats accepted: email,pass,date OR email|pass|date OR email pass date
          const parts = line.split(/[,|\s]+/).filter(Boolean);
          
          if (parts.length >= 2) {
              const email = parts[0].trim();
              const password = parts[1].trim();
              let date = new Date().toISOString();
              
              if (parts.length >= 3) {
                  const datePart = parts[2].trim();
                  // Try to parse YYYY-MM-DD
                  const d = new Date(datePart);
                  if (!isNaN(d.getTime())) date = d.toISOString();
              }

              await saveCredential({
                  id: '', // New ID
                  service: bulkService,
                  email,
                  password,
                  publishedAt: date,
                  isVisible: true
              });
              count++;
          }
      }
      setLoading(false);
      setBulkText('');
      setShowBulkImport(false);
      alert(`${count} contas importadas para ${bulkService}!`);
      loadData();
  };

  const handleDeleteCredential = async (id: string) => {
      if(confirm('Tem certeza? Clientes perderão acesso a esta conta.')) {
          await deleteCredential(id);
          loadData();
      }
  };

  // --- CLIENT MODAL ACTIONS ---
  const handleOpenClientModal = (client?: ClientDBRow) => {
      if (client) {
          setClientForm(client);
      } else {
          setClientForm({
              phone_number: '', client_name: '', client_password: '', subscriptions: [], duration_months: 1, is_debtor: false, is_contacted: false, purchase_date: toLocalInput(new Date().toISOString()), manual_credentials: {}
          });
      }
      setClientModalOpen(true);
  };

  const handleAddSubInModal = () => {
      const fullDate = new Date(newSubDate).toISOString();
      const newSubString = `${newSubService}|${fullDate}`;
      const currentSubs = normalizeSubscriptions(clientForm.subscriptions || []);
      const filtered = currentSubs.filter(s => !s.startsWith(newSubService));
      
      setClientForm({
          ...clientForm,
          subscriptions: [...filtered, newSubString]
      });
  };

  const handleRemoveSubInModal = (subString: string) => {
      const currentSubs = normalizeSubscriptions(clientForm.subscriptions || []);
      setClientForm({
          ...clientForm,
          subscriptions: currentSubs.filter(s => s !== subString)
      });
  };

  const handleRenewSubInModal = (subString: string) => {
      const serviceName = subString.split('|')[0];
      const now = new Date().toISOString();
      const newString = `${serviceName}|${now}`;
      const currentSubs = normalizeSubscriptions(clientForm.subscriptions || []);
      const newSubs = currentSubs.map(s => s === subString ? newString : s);
      setClientForm({ ...clientForm, subscriptions: newSubs });
  };

  const handleSaveClient = async () => {
      if (!clientForm.phone_number) return alert("Telefone obrigatório");
      setSavingClient(true);
      await saveClientToDB(clientForm);
      setSavingClient(false);
      setClientModalOpen(false);
      loadData();
  };

  const handleClientAction = async (action: 'delete' | 'restore' | 'permanent', id: string) => {
      if (action === 'delete') { if(confirm('Mover para lixeira?')) await deleteClientFromDB(id); }
      if (action === 'restore') await restoreClient(id);
      if (action === 'permanent') { if(confirm('Excluir PERMANENTEMENTE?')) await permanentlyDeleteClient(id); }
      loadData();
  };

  // --- FILTERING & SORTING ---
  const processClients = () => {
      let list = clients;
      const now = new Date();

      if (clientSearch) {
          const lower = clientSearch.toLowerCase();
          list = list.filter(c => c.phone_number.includes(lower) || c.client_name?.toLowerCase().includes(lower));
      }

      if (clientSubTab === 'trash') return list.filter(c => c.deleted);
      list = list.filter(c => !c.deleted);

      if (clientSubTab === 'active') {
          list = list.filter(c => {
             const subs = normalizeSubscriptions(c.subscriptions);
             return subs.some(s => {
                 const date = s.split('|')[1] ? new Date(s.split('|')[1]) : new Date(c.purchase_date);
                 const exp = calculateExpiry(date.toISOString(), c.duration_months);
                 return exp > now;
             });
          });
      }
      if (clientSubTab === 'expiring') {
          list = list.filter(c => {
             const subs = normalizeSubscriptions(c.subscriptions);
             return subs.some(s => {
                 const date = s.split('|')[1] ? new Date(s.split('|')[1]) : new Date(c.purchase_date);
                 const exp = calculateExpiry(date.toISOString(), c.duration_months);
                 const days = getDaysRemaining(exp);
                 return days >= 0 && days <= 5;
             });
          });
      }
      if (clientSubTab === 'expired') {
          list = list.filter(c => {
             const subs = normalizeSubscriptions(c.subscriptions);
             return subs.some(s => {
                 const date = s.split('|')[1] ? new Date(s.split('|')[1]) : new Date(c.purchase_date);
                 const exp = calculateExpiry(date.toISOString(), c.duration_months);
                 return exp < now;
             });
          });
      }
      
      if (clientSubTab === 'contacted') {
          list = list.filter(c => c.is_contacted);
      }

      if (serviceFilter !== 'all') {
          list = list.filter(c => normalizeSubscriptions(c.subscriptions).some(s => s.toLowerCase().includes(serviceFilter.toLowerCase())));
      }

      return list;
  };

  const processedCredentials = credentials.sort((a,b) => {
      const timeA = new Date(a.publishedAt).getTime();
      const timeB = new Date(b.publishedAt).getTime();
      return credSortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  const filteredClients = processClients();

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans pb-24">
      
      {/* HEADER - Removed 'sticky top-4' to fix overlap issues */}
      <div className="bg-white m-4 rounded-[2rem] shadow-sm p-4 flex justify-between items-center relative z-20">
          <div className="flex items-center gap-3 pl-2">
              <div className="bg-gradient-to-tr from-pink-500 to-purple-600 p-2.5 rounded-2xl text-white shadow-lg shadow-pink-200">
                  <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                  <h1 className="font-black text-xl text-gray-900 tracking-tight">Painel Admin</h1>
                  <p className="text-xs font-bold text-gray-400 uppercase">Gestão Completa</p>
              </div>
          </div>
          <button onClick={onLogout} className="bg-red-50 hover:bg-red-100 text-red-600 px-5 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Sair
          </button>
      </div>

      {/* TABS PRINCIPAIS */}
      <div className="flex gap-3 px-6 overflow-x-auto pb-2 scrollbar-hide">
          {[
              { id: 'clients', icon: Users, label: 'Gestão Clientes' },
              { id: 'credentials', icon: Key, label: 'Contas & Acessos' },
              { id: 'financial', icon: PieChart, label: 'Estatísticas & Receita' },
              { id: 'danger', icon: AlertTriangle, label: 'Zona Perigo' },
          ].map(tab => (
              <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 rounded-3xl font-bold whitespace-nowrap transition-all transform active:scale-95 shadow-sm ${
                      activeTab === tab.id 
                      ? 'bg-gray-900 text-white shadow-xl scale-105' 
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
              >
                  <tab.icon className="w-5 h-5" /> {tab.label}
              </button>
          ))}
      </div>

      <main className="p-4 max-w-7xl mx-auto">
          
          {/* ================= CLIENTES ================= */}
          {activeTab === 'clients' && (
              <div className="space-y-6 animate-fade-in">
                  
                  {/* FILTROS E BUSCA */}
                  <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-4 z-40">
                      
                      {/* Search */}
                      <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-full w-full md:w-auto border border-gray-200 focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-100 transition-all">
                          <Search className="w-5 h-5 text-gray-400" />
                          <input 
                              className="bg-transparent outline-none text-sm font-bold text-gray-700 w-full md:w-64" 
                              placeholder="Buscar nome ou telefone..." 
                              value={clientSearch}
                              onChange={e => setClientSearch(e.target.value)}
                          />
                      </div>
                      
                      {/* Status Tabs (Pills) */}
                      <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 scrollbar-hide">
                          {[
                              { id: 'all', label: 'Todos' },
                              { id: 'active', label: 'Em Dia' },
                              { id: 'expiring', label: 'Vencendo' },
                              { id: 'expired', label: 'Vencidos' },
                              { id: 'contacted', label: 'Cobrados' }, // NOVA ABA
                              { id: 'trash', label: 'Lixeira' }
                          ].map(sub => (
                              <button 
                                key={sub.id} 
                                onClick={() => setClientSubTab(sub.id as any)}
                                className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap ${
                                    clientSubTab === sub.id 
                                    ? (sub.id === 'expired' ? 'bg-red-500 text-white shadow-red-200' : sub.id === 'contacted' ? 'bg-blue-500 text-white shadow-blue-200' : sub.id === 'expiring' ? 'bg-orange-500 text-white shadow-orange-200' : 'bg-gray-900 text-white shadow-lg')
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                              >
                                  {sub.label}
                              </button>
                          ))}
                      </div>

                      <button onClick={() => handleOpenClientModal()} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-90 shrink-0">
                          <Plus className="w-6 h-6" />
                      </button>
                  </div>

                  {/* LISTA DE CLIENTES */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredClients.map(client => {
                          const activeSubs = normalizeSubscriptions(client.subscriptions);
                          return (
                              <div key={client.id} className={`bg-white p-6 rounded-[2rem] border shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all duration-300 ${client.deleted ? 'opacity-60 grayscale' : 'border-gray-100'}`}>
                                  
                                  {/* Top Row: Name & Actions */}
                                  <div className="flex justify-between items-start mb-4">
                                      <div>
                                          <div className="flex items-center gap-2">
                                              <h3 className="font-extrabold text-gray-900 text-lg leading-tight">{client.client_name || 'Sem Nome'}</h3>
                                              {client.is_debtor && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Bloqueado"></span>}
                                              {client.is_contacted && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Cobrado"></span>}
                                          </div>
                                          <p className="font-mono text-xs font-bold text-gray-400 mt-0.5 flex items-center gap-1">
                                              <Phone className="w-3 h-3"/> {client.phone_number}
                                          </p>
                                      </div>
                                      
                                      <div className="flex gap-2">
                                          {/* WHATSAPP BUTTON (LÓGICA INTELIGENTE) */}
                                          <button onClick={() => handleWhatsApp(client)} className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-sm active:scale-90">
                                              <MessageCircle className="w-5 h-5" />
                                          </button>
                                          <button onClick={() => handleOpenClientModal(client)} className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm active:scale-90">
                                              <Edit2 className="w-4 h-4" />
                                          </button>
                                      </div>
                                  </div>

                                  {/* Subscriptions Chips */}
                                  <div className="flex flex-col gap-2 mb-4">
                                      {activeSubs.length > 0 ? activeSubs.map((sub, i) => {
                                          const [name, dateStr] = sub.split('|');
                                          const date = dateStr ? new Date(dateStr) : new Date(client.purchase_date);
                                          const expiry = calculateExpiry(date.toISOString(), client.duration_months);
                                          const days = getDaysRemaining(expiry);
                                          
                                          let colorClass = "bg-gray-100 text-gray-600 border-gray-200";
                                          let statusIcon = <Clock className="w-3 h-3" />;
                                          
                                          if (days < 0) { colorClass = "bg-red-50 text-red-700 border-red-200"; statusIcon = <AlertTriangle className="w-3 h-3"/>; }
                                          else if (days <= 5) { colorClass = "bg-orange-50 text-orange-700 border-orange-200"; statusIcon = <Activity className="w-3 h-3"/>; }
                                          else { colorClass = "bg-green-50 text-green-700 border-green-200"; statusIcon = <CheckCircle2 className="w-3 h-3"/>; }

                                          return (
                                              <div key={i} className={`flex justify-between items-center px-3 py-2 rounded-xl border text-xs font-bold ${colorClass}`}>
                                                  <span className="truncate">{name}</span>
                                                  <div className="flex items-center gap-1.5">
                                                      <span>{days < 0 ? 'Venceu' : `${days}d`}</span>
                                                      {statusIcon}
                                                  </div>
                                              </div>
                                          );
                                      }) : <p className="text-gray-300 text-sm font-bold italic py-2">Sem assinaturas</p>}
                                  </div>

                                  {/* Footer Actions */}
                                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                                      {client.deleted ? (
                                          <>
                                            <button onClick={() => handleClientAction('restore', client.id)} className="flex-1 bg-green-100 text-green-700 font-bold py-2 rounded-xl text-xs hover:bg-green-200">Restaurar</button>
                                            <button onClick={() => handleClientAction('permanent', client.id)} className="flex-1 bg-red-100 text-red-700 font-bold py-2 rounded-xl text-xs hover:bg-red-200">Excluir</button>
                                          </>
                                      ) : (
                                          <button onClick={() => handleClientAction('delete', client.id)} className="flex-1 bg-gray-50 text-gray-400 font-bold py-2 rounded-xl text-xs hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center gap-2">
                                              <Trash2 className="w-3 h-3" /> Mover para Lixeira
                                          </button>
                                      )}
                                  </div>

                              </div>
                          );
                      })}
                  </div>
                  {filteredClients.length === 0 && (
                      <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
                          <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                          <p className="text-gray-400 font-bold">Nenhum cliente encontrado nesta aba.</p>
                      </div>
                  )}
              </div>
          )}

          {/* ... (Credentials, Financial, Danger Zone remain the same) ... */}
          {/* ================= CONTAS (CREDENTIALS) ================= */}
          {activeTab === 'credentials' && (
               <div className="space-y-6 animate-fade-in">
                  
                  {/* CARD DE AÇÕES (Nova Conta + Importar) */}
                  <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-200 relative">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-xl">
                              {isEditingCred ? <Edit2 className="w-6 h-6 text-blue-500"/> : <Plus className="w-6 h-6 text-green-500"/>} 
                              {isEditingCred ? 'Editar Conta' : 'Gerenciar Acessos'}
                          </h3>
                          <div className="flex gap-2">
                              {/* SORT BUTTON */}
                              <button 
                                onClick={() => setCredSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                                className="flex items-center gap-1 text-xs font-bold bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl text-gray-600 transition-colors"
                              >
                                  <ArrowDownUp className="w-4 h-4" />
                                  {credSortOrder === 'newest' ? 'Recentes' : 'Antigas'}
                              </button>
                              
                              {/* IMPORT BUTTON */}
                              <button 
                                onClick={() => setShowBulkImport(!showBulkImport)}
                                className="flex items-center gap-1 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl text-indigo-600 transition-colors"
                              >
                                  <FileUp className="w-4 h-4" /> Importar
                              </button>
                          </div>
                      </div>

                      {/* AREA DE IMPORTAÇÃO EM MASSA */}
                      {showBulkImport && (
                          <div className="bg-indigo-50 p-4 rounded-2xl mb-6 border border-indigo-100 animate-slide-up">
                              <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><FileUp className="w-4 h-4"/> Importação em Massa</h4>
                              <div className="flex gap-2 mb-2">
                                  <select className="p-3 rounded-xl font-bold text-sm bg-white border border-indigo-200 outline-none" value={bulkService} onChange={e => setBulkService(e.target.value)}>
                                      {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                  <div className="flex-1 bg-white p-3 rounded-xl border border-indigo-200 text-xs text-gray-500 flex items-center gap-2">
                                      <Info className="w-4 h-4"/> Formato: <b>email,senha,data(opcional)</b> (Uma por linha)
                                  </div>
                              </div>
                              <textarea 
                                  className="w-full h-32 p-3 rounded-xl border border-indigo-200 bg-white text-sm font-mono focus:ring-2 focus:ring-indigo-300 outline-none"
                                  placeholder={`exemplo1@email.com,senha123\nexemplo2@email.com,senha456,2023-10-25`}
                                  value={bulkText}
                                  onChange={e => setBulkText(e.target.value)}
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                  <button onClick={() => setShowBulkImport(false)} className="px-4 py-2 text-indigo-600 font-bold hover:bg-indigo-100 rounded-xl transition-colors">Cancelar</button>
                                  <button onClick={handleBulkImport} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md">Processar Importação</button>
                              </div>
                          </div>
                      )}

                      {/* FORMULÁRIO PADRÃO (SINGLE) */}
                      {!showBulkImport && (
                          <form onSubmit={handleSaveCredential} className="flex flex-col md:flex-row gap-4">
                              <select className="p-4 border rounded-2xl bg-gray-50 font-bold text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100" value={credForm.service} onChange={e => setCredForm({...credForm, service: e.target.value})}>
                                  {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <input className="p-4 border rounded-2xl bg-gray-50 font-bold text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100 flex-1" placeholder="Email do serviço" value={credForm.email} onChange={e => setCredForm({...credForm, email: e.target.value})} />
                              <input className="p-4 border rounded-2xl bg-gray-50 font-bold text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-100 flex-1" placeholder="Senha" value={credForm.password} onChange={e => setCredForm({...credForm, password: e.target.value})} />
                              
                              <div className="flex gap-2">
                                  {isEditingCred && <button type="button" onClick={() => { setIsEditingCred(false); setCredForm({service: SERVICES[0], email: '', password: '', isVisible: true, publishedAt: new Date().toISOString()}); }} className="bg-gray-200 text-gray-700 font-bold px-6 py-3 rounded-2xl">X</button>}
                                  <button type="submit" className="bg-gray-900 text-white font-bold px-8 py-3 rounded-2xl hover:bg-black shadow-lg shadow-gray-300 active:scale-95 transition-all">Salvar</button>
                              </div>
                          </form>
                      )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {processedCredentials.map(cred => {
                          // Lógica de escurecimento visual
                          const nameColorClass = getCredentialNameStyle(cred.service, cred.publishedAt);
                          // Lógica de validade (NOVO)
                          const health = getCredentialHealth(cred.service, cred.publishedAt);
                          
                          return (
                              <div key={cred.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 hover:shadow-xl transition-all group">
                                  <div className="flex justify-between items-start mb-4">
                                      <span className={`bg-gray-50 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide transition-colors duration-500 ${nameColorClass}`}>
                                          {cred.service}
                                      </span>
                                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => { setCredForm(cred); setIsEditingCred(true); setShowBulkImport(false); window.scrollTo(0,0); }} className="p-2 bg-gray-100 rounded-full hover:bg-blue-100 text-blue-600"><Edit2 className="w-4 h-4"/></button>
                                          <button onClick={() => handleDeleteCredential(cred.id)} className="p-2 bg-gray-100 rounded-full hover:bg-red-100 text-red-600"><Trash2 className="w-4 h-4"/></button>
                                      </div>
                                  </div>
                                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4">
                                      <p className="text-sm font-bold text-gray-800 break-all mb-1">{cred.email}</p>
                                      <p className="text-sm font-mono text-gray-500">{cred.password}</p>
                                  </div>
                                  
                                  {/* Health Indicator (NOVO) */}
                                  <div className={`mb-4 flex items-center justify-center p-2 rounded-xl border text-xs font-bold gap-2 ${health.color}`}>
                                      {health.icon} {health.label}
                                  </div>

                                  <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {credCounts[cred.id] || 0} Usuários</span>
                                      <span>{new Date(cred.publishedAt).toLocaleDateString()}</span>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
               </div>
          )}

          {/* ================= FINANCEIRO ================= */}
          {activeTab === 'financial' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[3rem] p-8 text-white shadow-xl relative overflow-hidden">
                      <div className="relative z-10">
                          <p className="text-emerald-100 font-bold uppercase tracking-wider text-sm mb-1">Receita Mensal Estimada</p>
                          <h2 className="text-5xl font-black mb-6">R$ {financials.reduce((acc, curr) => acc + curr.revenue, 0).toFixed(2).replace('.', ',')}</h2>
                          <div className="flex gap-4">
                              <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl">
                                  <p className="text-xs font-bold opacity-80">Total Ativos</p>
                                  <p className="text-2xl font-black">{financials.reduce((acc, curr) => acc + curr.active, 0)}</p>
                              </div>
                              <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl">
                                  <p className="text-xs font-bold opacity-80">Desistências (Lixeira)</p>
                                  <p className="text-2xl font-black text-red-200">{financials.reduce((acc, curr) => acc + curr.churn, 0)}</p>
                              </div>
                          </div>
                      </div>
                      <DollarSign className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-white opacity-10 rotate-12" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {financials.map((item) => (
                          <div key={item.name} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                              <div className="flex justify-between items-center mb-4">
                                  <h3 className="font-black text-gray-800 text-lg">{item.name}</h3>
                                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                                      {item.active} Clientes
                                  </span>
                              </div>
                              
                              <div className="space-y-4">
                                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                      <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Rendimento</p>
                                      <p className="text-2xl font-black text-emerald-800">R$ {item.revenue.toFixed(2).replace('.', ',')}</p>
                                  </div>
                                  
                                  <div className="flex items-center justify-between bg-red-50 p-3 rounded-xl border border-red-100">
                                      <div className="flex items-center gap-2">
                                          <TrendingDown className="w-4 h-4 text-red-500" />
                                          <span className="text-xs font-bold text-red-700">Desistências</span>
                                      </div>
                                      <span className="font-black text-red-800">{item.churn}</span>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* ================= ZONA DE PERIGO ================= */}
          {activeTab === 'danger' && (
              <div className="max-w-md mx-auto bg-red-50 p-8 rounded-[3rem] border-4 border-white shadow-2xl text-center mt-10">
                  <div className="bg-red-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShieldAlert className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-black text-red-900 mb-2">Zona de Perigo</h3>
                  <p className="text-red-700 font-medium mb-8">Cuidado! Ações irreversíveis.</p>
                  
                  <div className="space-y-3">
                      <button onClick={resetAllClientPasswords} className="w-full bg-white text-red-700 font-bold py-4 rounded-2xl hover:bg-red-100 transition-colors">Resetar Senhas Clientes</button>
                      <button onClick={resetAllNamesAndFixDates} className="w-full bg-white text-red-700 font-bold py-4 rounded-2xl hover:bg-red-100 transition-colors">Limpar Nomes / Fix Datas</button>
                      <button onClick={() => { if(confirm("Certeza ABSOLUTA?")) hardDeleteAllClients(); }} className="w-full bg-red-600 text-white font-bold py-4 rounded-2xl hover:bg-red-700 shadow-lg shadow-red-200 mt-4">WIPE TOTAL (Apagar Tudo)</button>
                  </div>
              </div>
          )}

      </main>

      {/* MODAL DE EDIÇÃO DE CLIENTE */}
      {clientModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
              <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
                  
                  {/* Modal Header */}
                  <div className="flex justify-between items-center mb-8">
                      <div>
                          <h3 className="font-black text-2xl text-gray-900">{clientForm.id ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Gerenciar Assinaturas</p>
                      </div>
                      <button onClick={() => setClientModalOpen(false)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X className="w-6 h-6 text-gray-600"/></button>
                  </div>

                  <div className="space-y-6">
                      {/* Dados Básicos */}
                      <div className="space-y-4">
                          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                              <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Telefone (WhatsApp)</label>
                              <input className="w-full bg-white p-3 rounded-xl font-mono text-lg font-bold text-gray-800 border-2 border-transparent focus:border-indigo-500 outline-none" placeholder="11999999999" value={clientForm.phone_number} onChange={e => setClientForm({...clientForm, phone_number: e.target.value})} />
                          </div>
                          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                              <label className="block text-xs font-black text-gray-400 uppercase mb-2 ml-1">Nome do Cliente</label>
                              <input className="w-full bg-white p-3 rounded-xl text-lg font-bold text-gray-800 border-2 border-transparent focus:border-indigo-500 outline-none" placeholder="Opcional" value={clientForm.client_name} onChange={e => setClientForm({...clientForm, client_name: e.target.value})} />
                          </div>
                          {/* Configurações Globais */}
                          <div className="flex gap-4">
                              <div className="flex-1 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Plano (Meses)</label>
                                  <select className="w-full bg-white p-2 rounded-lg font-bold text-gray-800 outline-none" value={clientForm.duration_months} onChange={e => setClientForm({...clientForm, duration_months: parseInt(e.target.value)})}>
                                      <option value={1}>Mensal (1)</option>
                                      <option value={3}>Trimestral (3)</option>
                                      <option value={6}>Semestral (6)</option>
                                      <option value={12}>Anual (12)</option>
                                  </select>
                              </div>
                              
                              {/* Bloqueado Toggle */}
                              <div 
                                  onClick={() => setClientForm({...clientForm, is_debtor: !clientForm.is_debtor})}
                                  className={`flex-1 p-4 rounded-2xl border cursor-pointer flex flex-col justify-center items-center transition-all ${clientForm.is_debtor ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}
                              >
                                  <span className={`text-xs font-black uppercase mb-1 ${clientForm.is_debtor ? 'text-red-600' : 'text-gray-400'}`}>Bloqueado?</span>
                                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${clientForm.is_debtor ? 'bg-red-500' : 'bg-gray-300'}`}>
                                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${clientForm.is_debtor ? 'translate-x-6' : ''}`}></div>
                                  </div>
                              </div>

                              {/* Cobrado Toggle (NOVO) */}
                              <div 
                                  onClick={() => setClientForm({...clientForm, is_contacted: !clientForm.is_contacted})}
                                  className={`flex-1 p-4 rounded-2xl border cursor-pointer flex flex-col justify-center items-center transition-all ${clientForm.is_contacted ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}
                              >
                                  <span className={`text-xs font-black uppercase mb-1 ${clientForm.is_contacted ? 'text-blue-600' : 'text-gray-400'}`}>Cobrado?</span>
                                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${clientForm.is_contacted ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${clientForm.is_contacted ? 'translate-x-6' : ''}`}></div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <hr className="border-gray-100" />

                      {/* --- GERENCIAR ASSINATURAS (ADICIONAR NOVA) --- */}
                      <div>
                          <h4 className="font-black text-gray-900 text-sm mb-3 uppercase flex items-center gap-2">
                              <Plus className="w-4 h-4 text-green-500" /> Adicionar Assinatura
                          </h4>
                          <div className="bg-gray-50 p-4 rounded-3xl border border-gray-200 flex flex-col gap-3">
                              <div className="flex gap-2">
                                  <select className="flex-1 p-3 rounded-xl font-bold text-sm outline-none bg-white border border-gray-200" value={newSubService} onChange={e => setNewSubService(e.target.value)}>
                                      {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                  <input type="date" className="w-32 p-3 rounded-xl font-bold text-sm outline-none bg-white border border-gray-200" value={newSubDate} onChange={e => setNewSubDate(e.target.value)} />
                              </div>
                              <button onClick={handleAddSubInModal} className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors text-sm">
                                  + Vincular Serviço
                              </button>
                          </div>
                      </div>

                      {/* --- LISTA DE ASSINATURAS ATIVAS --- */}
                      <div>
                          <h4 className="font-black text-gray-900 text-sm mb-3 uppercase flex items-center gap-2">
                              <Activity className="w-4 h-4 text-blue-500" /> Assinaturas Atuais
                          </h4>
                          <div className="space-y-2">
                              {normalizeSubscriptions(clientForm.subscriptions || []).length === 0 && (
                                  <p className="text-gray-400 text-xs font-bold italic text-center py-4">Nenhuma assinatura vinculada.</p>
                              )}
                              
                              {normalizeSubscriptions(clientForm.subscriptions || []).map((sub, idx) => {
                                  const [svc, dateStr] = sub.split('|');
                                  const date = dateStr ? new Date(dateStr) : new Date(clientForm.purchase_date || new Date());
                                  const formattedDate = date.toLocaleDateString();
                                  
                                  // Calcular dias restantes
                                  const exp = calculateExpiry(date.toISOString(), clientForm.duration_months || 1);
                                  const days = getDaysRemaining(exp);
                                  
                                  return (
                                      <div key={idx} className="flex items-center justify-between bg-white border border-gray-100 p-3 rounded-2xl shadow-sm">
                                          <div>
                                              <p className="font-bold text-gray-800 text-sm">{svc}</p>
                                              <p className={`text-[10px] font-bold uppercase ${days < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                  Compra: {formattedDate} ({days < 0 ? 'Vencido' : `${days} dias`})
                                              </p>
                                          </div>
                                          <div className="flex gap-2">
                                              {/* Botão Renovar Individualmente */}
                                              <button 
                                                onClick={() => handleRenewSubInModal(sub)}
                                                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"
                                                title="Renovar para Hoje (Resetar Data)"
                                              >
                                                  <RefreshCw className="w-4 h-4" />
                                              </button>
                                              <button 
                                                onClick={() => handleRemoveSubInModal(sub)}
                                                className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                                                title="Remover Assinatura"
                                              >
                                                  <Trash2 className="w-4 h-4" />
                                              </button>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>

                      <button onClick={handleSaveClient} disabled={savingClient} className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 hover:scale-[1.02] transition-transform active:scale-95 mt-4 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center">
                          {savingClient ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Salvar Alterações'}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default AdminPanel;

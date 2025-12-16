
import React, { useEffect, useState } from 'react';
import { User, AppCredential, SystemConfig } from '../types';
import { getAssignedCredential } from '../services/credentialService';
import { getSystemConfig, updateClientPreferences, updateClientName, getAllClients } from '../services/clientService';
import { CheckCircle, AlertCircle, Copy, RefreshCw, Check, Lock, CreditCard, ChevronRight, Star, Cast, Gamepad2, Rocket, X, Megaphone, Calendar, Clock, Crown, Zap, Palette, Upload, Image, Sparkles, Gift, AlertTriangle, Loader2, PlayCircle, Smartphone, Tv, ShoppingCart, RotateCw, Camera, Edit2, Trash2, MessageCircle, Key, Eye, EyeOff } from 'lucide-react';

interface DashboardProps {
  user: User;
  onOpenSupport: () => void;
  onOpenDoraminha: () => void;
  onOpenCheckout: (type: 'renewal' | 'gift' | 'new_sub' | 'early_renewal', targetService?: string) => void;
  onOpenGame: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  showPalette: boolean; 
  setShowPalette: (show: boolean) => void;
}

const COLORS = [
    { name: 'Rosa (Padrão)', value: '#ec4899', class: 'bg-pink-600', gradient: 'from-pink-500 to-pink-700', bgClass: 'bg-pink-50' },
    { name: 'Roxo', value: '#9333ea', class: 'bg-purple-600', gradient: 'from-purple-500 to-purple-700', bgClass: 'bg-purple-50' },
    { name: 'Azul', value: '#2563eb', class: 'bg-blue-600', gradient: 'from-blue-500 to-blue-700', bgClass: 'bg-blue-50' },
    { name: 'Verde', value: '#16a34a', class: 'bg-green-600', gradient: 'from-green-500 to-green-700', bgClass: 'bg-green-50' },
    { name: 'Laranja', value: '#ea580c', class: 'bg-orange-600', gradient: 'from-orange-500 to-orange-700', bgClass: 'bg-orange-50' },
    { name: 'Vermelho', value: '#dc2626', class: 'bg-red-600', gradient: 'from-red-500 to-red-700', bgClass: 'bg-red-50' },
    { name: 'Preto', value: '#111827', class: 'bg-gray-900', gradient: 'from-gray-800 to-black', bgClass: 'bg-gray-900' },
    { name: 'Ciano', value: '#06b6d4', class: 'bg-cyan-600', gradient: 'from-cyan-500 to-cyan-700', bgClass: 'bg-cyan-50' },
    { name: 'Indigo', value: '#4f46e5', class: 'bg-indigo-600', gradient: 'from-indigo-500 to-indigo-700', bgClass: 'bg-indigo-50' },
    { name: 'Rose', value: '#e11d48', class: 'bg-rose-600', gradient: 'from-rose-500 to-rose-700', bgClass: 'bg-rose-50' },
    { name: 'Violeta', value: '#7c3aed', class: 'bg-violet-600', gradient: 'from-violet-500 to-violet-700', bgClass: 'bg-violet-50' },
];

const SERVICE_CATALOG = [
    {
        id: 'Viki Pass',
        name: 'Viki Pass',
        benefits: ['Doramas Exclusivos', 'Sem Anúncios', 'Alta Qualidade (HD)', 'Acesso Antecipado'],
        price: 'R$ 19,90',
        color: 'from-blue-600 to-cyan-500',
        iconColor: 'bg-blue-600',
        shadow: 'shadow-blue-200'
    },
    {
        id: 'Kocowa+',
        name: 'Kocowa+',
        benefits: ['Shows de K-Pop Ao Vivo', 'Reality Shows Coreanos', 'Legendas Super Rápidas', '100% Coreano'],
        price: 'R$ 14,90',
        color: 'from-purple-600 to-indigo-600',
        iconColor: 'bg-purple-600',
        shadow: 'shadow-purple-200'
    },
    {
        id: 'IQIYI',
        name: 'IQIYI',
        benefits: ['Doramas Chineses (C-Drama)', 'Animes e BLs Exclusivos', 'Qualidade 4K e Dolby', 'Catálogo Gigante'],
        price: 'R$ 14,90',
        color: 'from-green-600 to-emerald-500',
        iconColor: 'bg-green-600',
        shadow: 'shadow-green-200'
    },
    {
        id: 'WeTV',
        name: 'WeTV',
        benefits: ['Séries Tencent Video', 'Mini Doramas Viciantes', 'Variedades Asiáticas', 'Dublagem em Português'],
        price: 'R$ 14,90',
        color: 'from-orange-500 to-red-500',
        iconColor: 'bg-orange-500',
        shadow: 'shadow-orange-200'
    },
    {
        id: 'DramaBox',
        name: 'DramaBox',
        benefits: ['Doramas Verticais (Shorts)', 'Episódios de 1 minuto', 'Histórias Intensas', 'Ideal para Celular'],
        price: 'R$ 14,90',
        color: 'from-pink-500 to-rose-500',
        iconColor: 'bg-pink-500',
        shadow: 'shadow-pink-200'
    }
];

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

const updateLocalSession = (updates: Partial<User>) => {
    const session = localStorage.getItem('eudorama_session');
    if (session) {
        const current = JSON.parse(session);
        localStorage.setItem('eudorama_session', JSON.stringify({ ...current, ...updates }));
    }
};

const Dashboard: React.FC<DashboardProps> = ({ user, onOpenSupport, onOpenCheckout, onOpenGame, onRefresh, isRefreshing, showPalette, setShowPalette }) => {
  const [assignedCredentials, setAssignedCredentials] = useState<{service: string, cred: AppCredential | null, alert: string | null, daysActive: number}[]>([]);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showStarInfo, setShowStarInfo] = useState(false);
  const [sysConfig, setSysConfig] = useState<SystemConfig | null>(null);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
  
  const [themeColor, setThemeColor] = useState(user.themeColor || COLORS[0].class);
  const [bgImage, setBgImage] = useState(user.backgroundImage || '');
  const [profileImage, setProfileImage] = useState(user.profileImage || '');
  
  const [userName, setUserName] = useState(user.name || 'Dorameira');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // FILTER: Ensure we don't process empty strings which cause blank rows
  const validServices = (user.services || []).filter(s => s && s.trim().length > 0);

  const getServiceName = (serviceString: string) => {
      if (!serviceString) return '';
      return serviceString.split('|')[0].trim();
  };

  const starsCount = Math.floor((user.completed?.length || 0) / 10);
  const userServicesLower = validServices.map(s => getServiceName(s).toLowerCase());
  const missingServices = SERVICE_CATALOG.filter(s => !userServicesLower.some(us => us.includes(s.id.toLowerCase())));

  const activeTheme = COLORS.find(c => c.class === themeColor) || COLORS[0];
  const bgStyle = bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : {}; 
  const containerClass = bgImage ? 'bg-black/50 min-h-screen pb-32 backdrop-blur-sm' : `${activeTheme.bgClass} min-h-screen pb-32 transition-colors duration-500 will-change-contents text-base`;

  const nameParts = userName ? userName.trim().split(' ').filter(Boolean) : [];
  const firstNameDisplay = nameParts[0] || (userName.trim() === '' ? '' : userName);
  const secondNameDisplay = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

  useEffect(() => {
      setUserName(user.name || 'Dorameira');
      setProfileImage(user.profileImage || '');
  }, [user]);

  const calculateSubscriptionStatus = (serviceName: string) => {
      const parts = serviceName.split('|');
      const cleanKey = parts[0].trim();
      const hasOverride = parts.length > 2 && parts[2] === 'OVERRIDE'; 

      let details = user.subscriptionDetails ? user.subscriptionDetails[cleanKey] : null;
      let purchaseDate = details ? new Date(details.purchaseDate) : new Date(user.purchaseDate);
      if (isNaN(purchaseDate.getTime())) purchaseDate = new Date();
      let duration = details ? details.durationMonths : (user.durationMonths || 1);
      
      const expiryDate = new Date(purchaseDate);
      expiryDate.setMonth(purchaseDate.getMonth() + duration);
      
      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const isExpired = daysLeft < 0;
      const isGracePeriod = isExpired && daysLeft >= -3; 
      
      const isBlocked = user.isDebtor || (isExpired && !isGracePeriod && !user.overrideExpiration && !hasOverride);
      
      return { expiryDate, daysLeft, isExpired, isGracePeriod, isBlocked };
  };

  const hasAnyBlockedService = validServices.some(svc => calculateSubscriptionStatus(svc).isBlocked);
  const hasAnyExpiredService = validServices.some(svc => calculateSubscriptionStatus(svc).isExpired);

  useEffect(() => {
    const loadCreds = async () => {
      setLoadingCreds(true);
      try {
          const [conf, allClients] = await Promise.all([
              getSystemConfig(),
              getAllClients()
          ]);
          setSysConfig(conf);
          const results = await Promise.all(validServices.map(async (rawService) => {
            const name = getServiceName(rawService);
            if (!name) return { service: rawService, cred: null, alert: null, daysActive: 0 };
            const result = await getAssignedCredential(user, name, allClients);
            return { service: rawService, cred: result.credential, alert: result.alert, daysActive: result.daysActive || 0 };
          }));
          setAssignedCredentials(results);
      } catch(e) {
          console.error("Erro carregando dashboard", e);
      } finally {
          setLoadingCreds(false);
      }
    };
    if (validServices.length > 0) loadCreds();
  }, [user]);

  const handleThemeChange = async (colorClass: string) => {
      setThemeColor(colorClass);
      updateLocalSession({ themeColor: colorClass });
      await updateClientPreferences(user.phoneNumber, { themeColor: colorClass });
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setUploadingImage(true);
          try {
              const compressedBase64 = await compressImage(file);
              setBgImage(compressedBase64);
              updateLocalSession({ backgroundImage: compressedBase64 });
              await updateClientPreferences(user.phoneNumber, { backgroundImage: compressedBase64 });
          } catch (error) { console.error(error); } finally { setUploadingImage(false); }
      }
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setUploadingImage(true);
          try {
              const compressedBase64 = await compressImage(file);
              setProfileImage(compressedBase64);
              updateLocalSession({ profileImage: compressedBase64 });
              await updateClientPreferences(user.phoneNumber, { profileImage: compressedBase64 });
          } catch (error) { console.error(error); } finally { setUploadingImage(false); }
      }
  };

  const handleRemoveProfileImage = async () => {
      setProfileImage('');
      updateLocalSession({ profileImage: '' });
      await updateClientPreferences(user.phoneNumber, { profileImage: '' });
  };

  const handleSaveName = async () => {
      setIsEditingName(false);
      const nameToSave = tempName; 
      setUserName(nameToSave); 
      updateLocalSession({ name: nameToSave });
      await updateClientName(user.phoneNumber, nameToSave);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (date: Date) => { try { return date.toLocaleDateString('pt-BR'); } catch (e) { return 'Data Inválida'; } };

  const handleServiceClick = (rawService: string) => {
      const name = getServiceName(rawService);
      const details = SERVICE_CATALOG.find(s => name.toLowerCase().includes(s.id.toLowerCase()));
      const { expiryDate, isBlocked } = calculateSubscriptionStatus(rawService);
      const cleanKey = getServiceName(rawService);
      const specPurchase = user.subscriptionDetails?.[cleanKey]?.purchaseDate ? new Date(user.subscriptionDetails[cleanKey].purchaseDate) : new Date(user.purchaseDate);
      
      const assigned = assignedCredentials.find(c => c.service === rawService);

      const modalData = details ? { 
          ...details, 
          customExpiry: expiryDate, 
          customPurchase: specPurchase,
          credential: assigned?.cred,
          isBlocked: isBlocked
      } : { 
          name: name, 
          benefits: ['Acesso total'], 
          price: 'R$ 14,90', 
          color: 'from-gray-500 to-gray-700', 
          customExpiry: expiryDate, 
          customPurchase: specPurchase, 
          credential: assigned?.cred,
          isBlocked: isBlocked
      };
      
      setShowPassword(false);
      setSelectedService(modalData);
  };
  
  const getBannerColor = (type: string) => {
      switch(type) {
          case 'warning': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
          case 'error': return 'bg-red-50 text-red-800 border-red-200';
          case 'success': return 'bg-green-50 text-green-800 border-green-200';
          default: return 'bg-blue-50 text-blue-800 border-blue-200';
      }
  };

  return (
    <div style={bgStyle}>
      <div className={containerClass}>
          
      {/* HEADER */}
      <div className="flex justify-between items-center px-5 pt-6 pb-2">
          <div className="flex items-center gap-5 w-full">
              <div className="relative group shrink-0">
                  <div className={`w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-xl relative ring-4 ring-pink-300`}>
                      <img src={profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="Profile" className="w-full h-full object-cover will-change-transform" />
                      {uploadingImage && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>}
                      <label className="absolute inset-0 cursor-pointer">
                          <input type="file" className="hidden" accept="image/*" onChange={handleProfileUpload} />
                      </label>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md border border-gray-200 pointer-events-none text-pink-600">
                      <Camera className="w-4 h-4" />
                  </div>
              </div>

              <div className="flex flex-col flex-1 min-w-0 justify-center">
                  {isEditingName ? (
                      <div className="flex items-center gap-2 py-1">
                          <input 
                              type="text" 
                              className="w-full bg-white/90 border-2 border-pink-300 rounded-lg px-2 py-1 text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-lg placeholder-gray-400"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              autoFocus
                              maxLength={20}
                              placeholder="Seu nome..."
                          />
                          <button onClick={handleSaveName} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-colors"><Check className="w-5 h-5"/></button>
                          <button onClick={() => setIsEditingName(false)} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-colors"><X className="w-5 h-5"/></button>
                      </div>
                  ) : (
                      <div className="flex items-start gap-1 group/name cursor-pointer py-1 min-h-[40px]" onClick={() => { setTempName(userName); setIsEditingName(true); }}>
                          <div className="flex flex-col leading-none">
                              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 tracking-tighter font-serif italic drop-shadow-sm">
                                  {firstNameDisplay}
                              </span>
                              {secondNameDisplay && (
                                  <span className="text-2xl font-bold text-gray-500 font-serif italic tracking-tight -mt-1 ml-0.5">
                                      {secondNameDisplay}
                                  </span>
                              )}
                              {!firstNameDisplay && <span className="text-gray-300 font-bold italic text-xl">Seu Nome</span>}
                          </div>
                          
                          <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-spin-slow flex-shrink-0 mt-2"/>
                          <div className="opacity-50 group-hover/name:opacity-100 transition-opacity p-1 bg-white/30 rounded-full hover:bg-white/50 mt-2">
                              <Edit2 className="w-3 h-3 text-gray-600" />
                          </div>
                      </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <div className="relative w-max group">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-200 animate-pulse"></div>
                          <div className="relative bg-white px-3 py-1 rounded-full flex items-center gap-1 border border-pink-100 shadow-sm">
                              <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500 animate-[bounce_2s_infinite]" />
                              <span className="text-[10px] font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-purple-600 uppercase tracking-widest">
                                  Membro VIP
                              </span>
                          </div>
                      </div>
                      
                      <button 
                        onClick={() => setShowStarInfo(true)} 
                        className="relative w-max group active:scale-95 transition-transform" 
                        title="Ver Pontuação"
                      >
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
                          <div className="relative bg-white px-3 py-1 rounded-full flex items-center gap-1 border border-yellow-200 shadow-sm hover:bg-yellow-50 transition-colors">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-[10px] font-extrabold text-yellow-700 uppercase tracking-widest">
                                  {starsCount} Estrelas
                              </span>
                          </div>
                      </button>
                  </div>
              </div>
          </div>
      </div>

      {/* GAMIFICATION MODAL */}
      {showStarInfo && (
          <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
              <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative border-4 border-yellow-300">
                  <button onClick={() => setShowStarInfo(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400"/></button>
                  <div className="text-center">
                      <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce"><Star className="w-10 h-10 text-yellow-600 fill-yellow-500" /></div>
                      <h3 className="text-2xl font-black text-gray-900 mb-2">Suas Estrelas!</h3>
                      <p className="text-gray-600 mb-6 text-sm leading-relaxed">Você ganha <strong>1 Estrela</strong> a cada <strong>10 Doramas</strong> que marcar como "Finalizado".<br/><br/>Junte estrelas para desbloquear surpresas no futuro! Continue assistindo! 🎬✨</p>
                      <button onClick={() => setShowStarInfo(false)} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95">Entendi, vou maratonar!</button>
                  </div>
              </div>
          </div>
      )}

      {/* THEME PICKER DRAWER */}
      {showPalette && (
          <div className="mx-4 mt-2 bg-white p-4 rounded-2xl shadow-xl border-2 border-gray-100 animate-fade-in-up relative z-20">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-800 text-sm">Personalizar Aparência</h3>
                  <button onClick={() => setShowPalette(false)}><X className="w-4 h-4 text-gray-400"/></button>
              </div>
              
              <div className="space-y-4">
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {COLORS.map(c => <button key={c.name} onClick={() => handleThemeChange(c.class)} className={`w-10 h-10 rounded-full flex-shrink-0 border-2 shadow-lg transition-all duration-300 ${c.class} ${themeColor === c.class ? 'border-white ring-2 ring-gray-900 scale-110 brightness-50' : 'border-transparent hover:scale-105'}`} title={c.name}></button>)}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
                      <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 border border-gray-200 transition-colors">
                          {uploadingImage ? <Loader2 className="w-4 h-4 text-pink-500 animate-spin" /> : <Image className="w-4 h-4 text-gray-600" />}
                          <span className="text-xs font-bold text-gray-700">Trocar Fundo</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleBgUpload} disabled={uploadingImage} />
                      </label>

                      {bgImage && (
                          <button onClick={() => {setBgImage(''); updateClientPreferences(user.phoneNumber, {backgroundImage: ''}); updateLocalSession({backgroundImage: ''}); }} className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl hover:bg-red-100 border border-red-100 transition-colors">
                              <Trash2 className="w-4 h-4 text-red-500" />
                              <span className="text-xs font-bold text-red-600">Remover Fundo</span>
                          </button>
                      )}

                      {profileImage && (
                          <button onClick={handleRemoveProfileImage} className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl hover:bg-red-100 border border-red-100 transition-colors">
                              <Trash2 className="w-4 h-4 text-red-500" />
                              <span className="text-xs font-bold text-red-600">Remover Foto Perfil</span>
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}
      
      {/* SERVICE DETAIL MODAL */}
      {selectedService && (
          <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] overflow-y-auto">
                  <div className={`h-32 bg-gradient-to-r ${selectedService.color} relative p-6 flex flex-col justify-end shrink-0`}><button onClick={() => setSelectedService(null)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md"><X className="w-5 h-5" /></button><h2 className="text-3xl font-black text-white drop-shadow-md">{selectedService.name}</h2></div>
                  <div className="p-6 space-y-6">
                      <div className="grid grid-cols-2 gap-3">
                           <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1 flex items-center justify-center gap-1"><Calendar className="w-3 h-3"/> Compra</p><p className="text-sm font-black text-gray-800">{formatDate(selectedService.customPurchase)}</p></div>
                           <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center"><p className="text-[10px] text-gray-400 font-bold uppercase mb-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3"/> Vence em</p><p className={`text-sm font-black text-gray-800`}>{formatDate(selectedService.customExpiry)}</p></div>
                      </div>

                      {selectedService.isBlocked ? (
                          <div className="bg-red-50 rounded-2xl p-4 border border-red-100 text-center">
                              <Lock className="w-8 h-8 text-red-400 mx-auto mb-2" />
                              <p className="text-red-900 font-bold text-sm">Acesso Temporariamente Indisponível</p>
                              <p className="text-red-700 text-xs mt-1">Sua assinatura venceu ou está bloqueada. Renove para ver os dados.</p>
                              <button onClick={() => onOpenCheckout('renewal', selectedService.name)} className="mt-3 w-full bg-red-600 text-white font-bold py-2 rounded-lg text-xs shadow-md active:scale-95">Renovar Acesso</button>
                          </div>
                      ) : !selectedService.credential ? (
                          <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100 text-center">
                              <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                              <p className="text-yellow-900 font-bold text-sm">Configuração Pendente</p>
                              <p className="text-yellow-700 text-xs mt-1">
                                  Sua assinatura está ativa, mas o sistema ainda está preparando seu login.
                                  <br/>Por favor, tente novamente em alguns instantes ou chame o suporte.
                              </p>
                              <button onClick={onOpenSupport} className="mt-3 w-full bg-yellow-500 text-white font-bold py-2 rounded-lg text-xs shadow-md active:scale-95">Chamar Suporte</button>
                          </div>
                      ) : (
                          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 space-y-3">
                              <div className="flex items-center gap-2 mb-1">
                                  <div className="bg-white p-1.5 rounded-lg shadow-sm"><Key className="w-4 h-4 text-blue-600" /></div>
                                  <span className="font-bold text-blue-900 text-sm">Dados de Acesso</span>
                              </div>
                              
                              <div>
                                  <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Email / Login</p>
                                  <div className="flex gap-2">
                                      <div className="bg-white px-3 py-2 rounded-xl flex-1 border border-blue-100 text-lg font-mono font-bold text-gray-700 select-all break-all">{selectedService.credential.email}</div>
                                      <button onClick={() => copyToClipboard(selectedService.credential.email, 'email')} className="bg-white p-2 rounded-xl border border-blue-100 hover:bg-blue-100 text-blue-600 transition-colors">
                                          {copiedId === 'email' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                      </button>
                                  </div>
                              </div>

                              <div>
                                  <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Senha</p>
                                  <div className="flex gap-2">
                                      <div className="bg-white px-3 py-2 rounded-xl flex-1 border border-blue-100 text-lg font-mono font-bold text-gray-700 flex items-center justify-between">
                                          <span>{showPassword ? selectedService.credential.password : '••••••••'}</span>
                                          <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                                              {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                                          </button>
                                      </div>
                                      <button onClick={() => copyToClipboard(selectedService.credential.password, 'pass')} className="bg-white p-2 rounded-xl border border-blue-100 hover:bg-blue-100 text-blue-600 transition-colors">
                                          {copiedId === 'pass' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                      </button>
                                  </div>
                              </div>
                              
                              <p className="text-[10px] text-blue-600/70 text-center font-medium mt-2">
                                  Use esses dados para entrar no app. Dúvidas? Chame o suporte.
                              </p>
                          </div>
                      )}

                      <button onClick={() => setSelectedService(null)} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-transform active:scale-95">Fechar Detalhes</button>
                  </div>
              </div>
          </div>
      )}

      {/* GLOBAL DEBT WARNING BANNER */}
      {hasAnyExpiredService && (
          <div className="mx-4 mt-4 p-4 rounded-xl border border-red-200 bg-red-50 flex items-start gap-3 shadow-md">
              <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
              <div>
                  <p className="font-black text-red-800 text-lg uppercase mb-1">Atenção, Dorameira!</p>
                  <p className="text-base text-red-700 font-medium leading-relaxed">
                      Algumas assinaturas venceram. Você tem um <strong>prazo de tolerância de 3 dias</strong> para ver os logins vencidos. Após isso, o acesso será bloqueado até a renovação.
                  </p>
                  <button onClick={() => onOpenCheckout('renewal')} className="mt-3 text-sm bg-red-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm active:scale-95 hover:bg-red-700 transition-colors">
                      Renovar Agora
                  </button>
              </div>
          </div>
      )}

      {/* SYSTEM BANNER */}
      {sysConfig?.bannerActive && sysConfig.bannerText && (
          <div className={`mx-4 p-4 rounded-xl border flex items-start gap-3 shadow-sm animate-pulse-slow ${getBannerColor(sysConfig.bannerType)}`}><Megaphone className="w-5 h-5 flex-shrink-0 mt-0.5" /><div><p className="font-bold text-sm leading-tight">{sysConfig.bannerText}</p></div></div>
      )}

      <div className="px-4 space-y-6 pt-4">
        
        {/* SUAS ASSINATURAS */}
        <div className={`rounded-3xl p-5 border relative bg-white/95 backdrop-blur-md ${hasAnyBlockedService ? 'border-red-200' : 'border-white'}`}>
             <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-3">
                     <div className={`p-2.5 rounded-xl ${hasAnyBlockedService ? 'bg-red-200 text-red-700' : 'bg-green-100 text-green-700'}`}><CreditCard className="w-6 h-6" /></div>
                     <div><h3 className="font-bold text-gray-900 text-xl leading-none">Suas Assinaturas</h3><p className={`text-sm font-bold mt-1 ${hasAnyBlockedService ? 'text-red-600' : 'text-green-600'}`}>{hasAnyBlockedService ? 'Renovação Necessária' : 'Status Ativo'}</p></div>
                 </div>
             </div>
             <div className="flex flex-col gap-3">
                 {validServices.length > 0 ? validServices.map((rawSvc, i) => {
                     const name = getServiceName(rawSvc);
                     if (!name) return null; // CRITICAL FIX: Skip if name is empty to avoid blank rows

                     const details = SERVICE_CATALOG.find(s => name.toLowerCase().includes(s.id.toLowerCase()));
                     const iconBg = details?.iconColor || 'bg-gray-500';
                     const { expiryDate, isBlocked, isGracePeriod, daysLeft } = calculateSubscriptionStatus(rawSvc);
                     
                     let buttonContent = null;
                     let expiryTextClass = "text-gray-400";
                     let expiryText = `Vence em: ${formatDate(expiryDate)}`;

                     if (isBlocked) { 
                         expiryTextClass = "text-red-500";
                         expiryText = "BLOQUEADO (Vencido)";
                         buttonContent = (
                              <button 
                                 onClick={(e) => { e.stopPropagation(); onOpenCheckout('renewal', name); }}
                                 className="mt-1 w-full bg-red-600 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-md shadow-red-200 animate-pulse active:scale-95 transition-transform flex items-center justify-center gap-1 uppercase tracking-wide"
                             >
                                 RENOVAR <RotateCw className="w-3 h-3 animate-spin-slow" />
                             </button>
                         );
                     } else if (isGracePeriod) { 
                         expiryTextClass = "text-orange-500";
                         expiryText = `VENCEU (${Math.abs(daysLeft)} dias tolerância)`;
                         buttonContent = (
                              <button 
                                 onClick={(e) => { e.stopPropagation(); onOpenCheckout('renewal', name); }}
                                 className="mt-1 w-full bg-orange-500 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-sm active:scale-95 transition-transform uppercase tracking-wide"
                             >
                                 RENOVAR AGORA
                             </button>
                         );
                     } else {
                         if (daysLeft <= 5) {
                             expiryTextClass = "text-yellow-600";
                             expiryText = `Vence em ${daysLeft} dias`;
                         }
                         
                         buttonContent = (
                             <button 
                                 onClick={(e) => { e.stopPropagation(); onOpenCheckout('early_renewal', name); }}
                                 className="mt-1 w-full bg-blue-600 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-1 uppercase tracking-wide"
                                 title="Adicione mais 30 dias ao seu plano atual sem perder nada"
                             >
                                 ADIANTAR RENOVAÇÃO <Calendar className="w-3 h-3" />
                             </button>
                         );
                     }

                     return (
                         <div key={i} className={`w-full flex items-center justify-between p-3 rounded-xl border bg-white hover:shadow-md transition-all relative overflow-hidden ${isBlocked ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                            <button onClick={() => handleServiceClick(rawSvc)} className="flex items-center gap-3 relative z-10 flex-1 text-left">
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${iconBg} shrink-0 text-xl`}>{name.substring(0,1).toUpperCase()}</div>
                                <div className="min-w-0 flex-1">
                                    <span className="font-bold text-gray-900 text-lg truncate block">{name}</span>
                                    <span className={`text-xs font-bold uppercase tracking-wide block mt-0.5 ${expiryTextClass}`}>{expiryText}</span>
                                </div>
                            </button>
                            
                            <div className="flex flex-col items-end gap-1 ml-3 relative z-10 w-auto min-w-[110px]">
                                {buttonContent}
                            </div>
                         </div>
                     );
                 }) : (
                     <div className="text-center p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                         <p className="text-gray-500 font-bold mb-2 text-lg">Você ainda não tem assinaturas ativas.</p>
                         <button onClick={() => onOpenCheckout('new_sub')} className="text-sm bg-gray-900 text-white px-6 py-3 rounded-lg font-bold">Ver Planos</button>
                     </div>
                 )}
             </div>
        </div>

        {/* ... (Assistente IA, Credenciais, etc) ... */}
        {assignedCredentials.some(c => c.cred) && (
            <div className="mt-2">
                <h3 className="font-bold text-gray-900 text-xl px-2 mb-3 flex items-center gap-2 mt-6">
                    <Key className="w-6 h-6 text-indigo-600" /> Seus Acessos
                </h3>
                
                <div className="flex flex-col gap-3">
                    {assignedCredentials.map((item, idx) => {
                        if (!item.cred) return null;
                        
                        const isViki = item.service.toLowerCase().includes('viki');
                        const cycleDays = isViki ? 14 : 30; 
                        const daysRemaining = Math.max(0, cycleDays - item.daysActive);
                        const progressPercent = Math.min(100, (item.daysActive / cycleDays) * 100);
                        
                        let progressColor = 'bg-green-500';
                        if (daysRemaining <= 3) progressColor = 'bg-red-500';
                        else if (daysRemaining <= 7) progressColor = 'bg-yellow-500';

                        return (
                            <div key={idx} className="bg-white border border-indigo-50 rounded-2xl p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${daysRemaining <= 3 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                                        <span className="font-black text-gray-700 text-base">{item.service.split('|')[0]}</span>
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${daysRemaining <= 3 ? 'bg-red-100 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                        {daysRemaining === 0 ? 'Troca Hoje' : `Renova em ${daysRemaining} dias`}
                                    </span>
                                </div>

                                <div className="space-y-3 relative z-10">
                                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors">
                                        <span className="text-lg font-mono text-gray-800 break-all select-all font-bold">{item.cred.email}</span>
                                        <button onClick={() => copyToClipboard(item.cred!.email, `email-${idx}`)} className="text-indigo-500 p-2 hover:bg-indigo-50 rounded-lg transition-colors ml-2">
                                            {copiedId === `email-${idx}` ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors">
                                        <span className="text-lg font-mono text-gray-800 select-all font-bold">{item.cred.password}</span>
                                        <button onClick={() => copyToClipboard(item.cred!.password, `pass-${idx}`)} className="text-indigo-500 p-2 hover:bg-indigo-50 rounded-lg transition-colors">
                                            {copiedId === `pass-${idx}` ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-100">
                                    <div 
                                        className={`h-full ${progressColor} transition-all duration-1000 ease-out`} 
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}

        {/* ... (Resto do componente) ... */}
        
        {missingServices.length > 0 && (
            <div className="mt-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-[2rem] border border-purple-100 shadow-lg relative overflow-hidden">
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <div className="bg-white p-3 rounded-2xl shadow-sm">
                        <Rocket className="w-8 h-8 text-purple-600 fill-purple-100" />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-900 text-2xl tracking-tight leading-none">Adicionar Planos</h3>
                        <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mt-1">Expanda seu universo de doramas</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 relative z-10">
                    {missingServices.map(svc => (
                        <div key={svc.id} className="bg-white p-5 rounded-2xl border border-purple-50 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group h-full">
                            <div>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${svc.color} flex items-center justify-center text-white font-bold text-xl mb-3 shadow-md`}>
                                    {svc.name.charAt(0)}
                                </div>
                                <h4 className="font-black text-gray-900 text-lg leading-tight mb-1">{svc.name}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-3">{svc.benefits[0]}</p>
                            </div>
                            
                            <button 
                                onClick={() => onOpenCheckout('new_sub', svc.name)}
                                className={`w-full py-3.5 rounded-xl text-xs font-black text-white shadow-lg shadow-purple-200 active:scale-95 transition-all hover:shadow-purple-300 bg-gradient-to-r ${svc.color} flex items-center justify-center gap-2 mt-2 group-hover:scale-[1.02]`}
                            >
                                QUERO ASSINAR <Sparkles className="w-3 h-3 animate-spin-slow" />
                            </button>
                        </div>
                    ))}
                </div>
                
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl opacity-20 -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-200 to-indigo-200 rounded-full blur-3xl opacity-20 -ml-10 -mb-10 pointer-events-none"></div>
            </div>
        )}

      </div>
      </div>
    </div>
  );
};

export default Dashboard;

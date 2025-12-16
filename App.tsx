
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DoramaList from './components/DoramaList';
import SupportChat from './components/SupportChat';
import CheckoutModal from './components/CheckoutModal';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import NameModal from './components/NameModal';
import GamesHub from './components/GamesHub';
import Toast from './components/Toast';
import { User, Dorama } from './types';
import { addDoramaToDB, updateDoramaInDB, removeDoramaFromDB, getUserDoramasFromDB, saveGameProgress, syncDoramaBackup, addLocalDorama, refreshUserProfile, updateLastActive } from './services/clientService';
import { Heart, X, CheckCircle2, MessageCircle, Gift, Gamepad2, Sparkles, Home, Tv2, Palette, RefreshCw, LogOut, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'watching' | 'favorites' | 'games' | 'completed'>('home');
  const [isTestSession, setIsTestSession] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Feature States
  const [showPalette, setShowPalette] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutType, setCheckoutType] = useState<'renewal' | 'gift' | 'new_sub' | 'early_renewal'>('renewal');
  const [checkoutTargetService, setCheckoutTargetService] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'watching' | 'favorites' | 'completed'>('watching');
  const [editingDorama, setEditingDorama] = useState<Dorama | null>(null);
  
  const [newDoramaName, setNewDoramaName] = useState('');
  const [newDoramaSeason, setNewDoramaSeason] = useState('1');
  const [newDoramaTotalEp, setNewDoramaTotalEp] = useState('16');
  const [newDoramaRating, setNewDoramaRating] = useState(5);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [doramaToDelete, setDoramaToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showNameModal, setShowNameModal] = useState(false);

  // --- INITIALIZATION ---

  useEffect(() => {
    // 1. Check Client Login (Local OR Session)
    let savedSession = localStorage.getItem('eudorama_session');
    if (!savedSession) {
        savedSession = sessionStorage.getItem('eudorama_session');
    }

    if (savedSession) {
      try {
        const user = JSON.parse(savedSession);
        if (user && user.phoneNumber) {
          getUserDoramasFromDB(user.phoneNumber).then(doramas => {
             const updatedUser = {
               ...user,
               watching: doramas.watching,
               favorites: doramas.favorites,
               completed: doramas.completed
             };
             // Re-login user silently without 'isTest' flag unless it was stored
             handleLogin(updatedUser, !!localStorage.getItem('eudorama_session'), false);
          });
        }
      } catch (e) {
        localStorage.removeItem('eudorama_session');
        sessionStorage.removeItem('eudorama_session');
      }
    }

    // 2. Check Admin Login (Local OR Session)
    const adminSessionLocal = localStorage.getItem('eudorama_admin_session');
    const adminSessionSession = sessionStorage.getItem('eudorama_admin_session');
    
    if (adminSessionLocal === 'true' || adminSessionSession === 'true') {
        setIsAdminMode(true);
        setIsAdminLoggedIn(true);
    }
  }, []);

  // --- SIDE EFFECTS ---

  useEffect(() => {
      if (currentUser && !isTestSession && !isAdminMode) {
          syncDoramaBackup(currentUser.phoneNumber, {
              watching: currentUser.watching,
              favorites: currentUser.favorites,
              completed: currentUser.completed
          });
      }
  }, [currentUser?.watching, currentUser?.favorites, currentUser?.completed]);

  useEffect(() => {
      if (!currentUser || isTestSession || isAdminMode) return;

      updateLastActive(currentUser.phoneNumber);

      const heartbeatInterval = setInterval(() => {
          if (document.visibilityState === 'visible') {
              updateLastActive(currentUser.phoneNumber);
          }
      }, 2 * 60 * 1000);

      const onFocus = () => {
          handleRefreshSession(true); 
          updateLastActive(currentUser.phoneNumber);
      };

      window.addEventListener('focus', onFocus);
      window.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') onFocus();
      });

      return () => {
          clearInterval(heartbeatInterval);
          window.removeEventListener('focus', onFocus);
      };
  }, [currentUser?.phoneNumber, isTestSession, isAdminMode]);

  useEffect(() => {
      let timer: ReturnType<typeof setTimeout>;
      if (isTestSession && currentUser) {
          timer = setTimeout(() => {
              alert('Sessão de teste expirada (1 hora).');
              handleLogout();
          }, 60 * 60 * 1000);
      }
      return () => clearTimeout(timer);
  }, [isTestSession, currentUser]);

  useEffect(() => {
      if (currentUser && !isTestSession) {
          if (currentUser.name === 'Dorameira' || !currentUser.name) {
              setShowNameModal(true);
          }
      }
  }, [currentUser, isTestSession]);

  // --- HANDLERS ---

  const handleLogin = (user: User, remember: boolean = false, isTest: boolean = false) => {
    setCurrentUser(user);
    setIsTestSession(isTest);
    
    if (!isTest) {
        const userData = JSON.stringify(user);
        if (remember) {
            localStorage.setItem('eudorama_session', userData);
            sessionStorage.removeItem('eudorama_session'); // Clear session if local exists
        } else {
            sessionStorage.setItem('eudorama_session', userData);
            localStorage.removeItem('eudorama_session'); // Clear local if session preferred
        }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('home');
    setIsTestSession(false);
    localStorage.removeItem('eudorama_session');
    sessionStorage.removeItem('eudorama_session');
  };

  const handleRefreshSession = async (silent: boolean = false) => {
      if (!currentUser) return;
      if (!silent) setIsRefreshing(true);
      
      const { user, error } = await refreshUserProfile(currentUser.phoneNumber);
      
      if (user) {
          const updatedUser = {
              ...user,
              watching: currentUser.watching,
              favorites: currentUser.favorites,
              completed: currentUser.completed,
              themeColor: user.themeColor || currentUser.themeColor,
              backgroundImage: user.backgroundImage || currentUser.backgroundImage,
              profileImage: user.profileImage || currentUser.profileImage
          };
          // Preserve session type (Local vs Session)
          const isLocal = !!localStorage.getItem('eudorama_session');
          handleLogin(updatedUser, isLocal, isTestSession);
          
          if (!silent) setToast({ message: 'Dados sincronizados!', type: 'success' });
      } else {
          if (!silent) setToast({ message: error || 'Erro ao sincronizar.', type: 'error' });
      }
      if (!silent) setIsRefreshing(false);
  };

  const handleNameSaved = (newName: string) => {
      if (currentUser) {
          const updatedUser = { ...currentUser, name: newName };
          setCurrentUser(updatedUser);
          
          const isLocal = !!localStorage.getItem('eudorama_session');
          if (isLocal) localStorage.setItem('eudorama_session', JSON.stringify(updatedUser));
          else sessionStorage.setItem('eudorama_session', JSON.stringify(updatedUser));
      }
      setShowNameModal(false);
  };

  const handleAdminClick = () => {
    setIsAdminMode(true);
    // DO NOT automatically set logged in true here. Only show the login form.
    // Check if session exists first.
    const adminSessionLocal = localStorage.getItem('eudorama_admin_session');
    const adminSessionSession = sessionStorage.getItem('eudorama_admin_session');
    if (adminSessionLocal === 'true' || adminSessionSession === 'true') {
        setIsAdminLoggedIn(true);
    } else {
        setIsAdminLoggedIn(false);
    }
  };

  const handleAdminSuccess = (remember: boolean) => {
    setIsAdminLoggedIn(true);
    if (remember) {
        localStorage.setItem('eudorama_admin_session', 'true');
        sessionStorage.removeItem('eudorama_admin_session');
    } else {
        sessionStorage.setItem('eudorama_admin_session', 'true');
        localStorage.removeItem('eudorama_admin_session');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setIsAdminMode(false);
    localStorage.removeItem('eudorama_admin_session');
    sessionStorage.removeItem('eudorama_admin_session');
  };

  const handleOpenCheckout = (type: 'renewal' | 'gift' | 'new_sub' | 'early_renewal', targetService?: string) => {
    setCheckoutType(type);
    setCheckoutTargetService(targetService || null);
    setIsCheckoutOpen(true);
  };

  const handleUpdateDorama = async (updatedDorama: Dorama) => {
    if (!currentUser) return;
    const listKey = activeTab === 'favorites' ? 'favorites' : (activeTab === 'completed' ? 'completed' : 'watching');
    if (activeTab === 'games' || activeTab === 'home') return; 

    const newList = currentUser[listKey as 'watching' | 'favorites' | 'completed'].map(d => d.id === updatedDorama.id ? updatedDorama : d);
    const newUserState = { ...currentUser, [listKey]: newList };
    setCurrentUser(newUserState);
    
    // Update Storage
    const isLocal = !!localStorage.getItem('eudorama_session');
    if (isLocal) localStorage.setItem('eudorama_session', JSON.stringify(newUserState));
    else sessionStorage.setItem('eudorama_session', JSON.stringify(newUserState));

    addLocalDorama(currentUser.phoneNumber, listKey as any, updatedDorama);
    const success = await updateDoramaInDB(updatedDorama);
    
    if (success) setToast({ message: 'Salvo com sucesso!', type: 'success' });
    else setToast({ message: 'Erro ao salvar.', type: 'error' });
  };

  const handleConfirmDelete = async () => {
    if (!currentUser || !doramaToDelete) return;
    setIsDeleting(true);
    
    const listKey = activeTab === 'favorites' ? 'favorites' : (activeTab === 'completed' ? 'completed' : 'watching');
    const newList = currentUser[listKey as 'watching' | 'favorites' | 'completed'].filter(d => d.id !== doramaToDelete);
    const newUserState = { ...currentUser, [listKey]: newList };
    
    setCurrentUser(newUserState);
    
    const isLocal = !!localStorage.getItem('eudorama_session');
    if (isLocal) localStorage.setItem('eudorama_session', JSON.stringify(newUserState));
    else sessionStorage.setItem('eudorama_session', JSON.stringify(newUserState));

    const success = await removeDoramaFromDB(doramaToDelete);
    
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setDoramaToDelete(null);

    if (success) setToast({ message: 'Dorama removido!', type: 'success' });
    else setToast({ message: 'Erro ao remover.', type: 'error' });
  };

  const handleSaveGame = async (gameId: string, data: any) => {
      if (!currentUser) return;
      const newProgress = { ...currentUser.gameProgress, [gameId]: data };
      const updatedUser = { ...currentUser, gameProgress: newProgress };
      setCurrentUser(updatedUser);
      
      const isLocal = !!localStorage.getItem('eudorama_session');
      if (isLocal) localStorage.setItem('eudorama_session', JSON.stringify(updatedUser));
      else sessionStorage.setItem('eudorama_session', JSON.stringify(updatedUser));

      await saveGameProgress(currentUser.phoneNumber, gameId, data);
  };

  const getModalTitle = () => {
      if (editingDorama) return 'Editar Dorama';
      if (modalType === 'favorites') return 'Novo Favorito';
      if (modalType === 'completed') return 'Dorama Finalizado';
      return 'O que está vendo?';
  };

  // --- RENDER ---

  if (isAdminMode) {
    if (isAdminLoggedIn) return <AdminPanel onLogout={handleAdminLogout} />;
    return <AdminLogin onSuccess={handleAdminSuccess} onBack={() => setIsAdminMode(false)} />;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} onAdminClick={handleAdminClick} />;
  }

  const openAddModal = (type: 'watching' | 'favorites' | 'completed') => {
    setModalType(type);
    setEditingDorama(null);
    setNewDoramaName('');
    setNewDoramaSeason('1');
    setNewDoramaTotalEp('16');
    setNewDoramaRating(5);
    setIsModalOpen(true);
  };

  const openEditModal = (dorama: Dorama) => {
    if (activeTab === 'games' || activeTab === 'home') return;
    setModalType(activeTab); 
    setEditingDorama(dorama);
    setNewDoramaName(dorama.title);
    setNewDoramaSeason(dorama.season ? dorama.season.toString() : '1');
    setNewDoramaTotalEp(dorama.totalEpisodes ? dorama.totalEpisodes.toString() : '16');
    setNewDoramaRating(dorama.rating || 5);
    setIsModalOpen(true);
  };

  const saveDorama = async () => {
    if (!currentUser || !newDoramaName.trim()) return;

    let status: Dorama['status'] = 'Watching';
    if (modalType === 'favorites') status = 'Plan to Watch';
    if (modalType === 'completed') status = 'Completed';

    const season = parseInt(newDoramaSeason) || 1;
    const total = parseInt(newDoramaTotalEp) || 16;
    const rating = newDoramaRating;

    if (editingDorama) {
        const updated: Dorama = { ...editingDorama, title: newDoramaName, season, totalEpisodes: total, rating };
        setIsModalOpen(false);
        await handleUpdateDorama(updated);
    } else {
        const tempDorama: Dorama = {
          id: 'temp-' + Date.now(), 
          title: newDoramaName,
          genre: 'Drama',
          thumbnail: `https://ui-avatars.com/api/?name=${newDoramaName}&background=random&size=128`,
          status,
          episodesWatched: modalType === 'completed' ? total : 1,
          totalEpisodes: total,
          season,
          rating
        };
    
        setIsModalOpen(false);
    
        setCurrentUser(prev => {
            if (!prev) return null;
            const newState = { ...prev, [modalType]: [...prev[modalType], tempDorama] };
            
            const isLocal = !!localStorage.getItem('eudorama_session');
            if (isLocal) localStorage.setItem('eudorama_session', JSON.stringify(newState));
            else sessionStorage.setItem('eudorama_session', JSON.stringify(newState));
            
            return newState;
        });

        const createdDorama = await addDoramaToDB(currentUser.phoneNumber, modalType, tempDorama);
    
        if (createdDorama) {
          setToast({ message: 'Adicionado com sucesso!', type: 'success' });
          setCurrentUser(prev => {
            if (!prev) return null;
            const updatedList = prev[modalType].map(d => d.id === tempDorama.id ? createdDorama : d);
            const newState = { ...prev, [modalType]: updatedList };
            
            const isLocal = !!localStorage.getItem('eudorama_session');
            if (isLocal) localStorage.setItem('eudorama_session', JSON.stringify(newState));
            else sessionStorage.setItem('eudorama_session', JSON.stringify(newState));
            
            return newState;
          });
        } else {
          setToast({ message: 'Erro ao salvar no banco.', type: 'error' });
        }
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard 
                  user={currentUser} 
                  onOpenSupport={() => setIsSupportOpen(true)} 
                  onOpenDoraminha={() => {}} 
                  onOpenCheckout={handleOpenCheckout}
                  onOpenGame={() => setActiveTab('games')}
                  onRefresh={() => handleRefreshSession(false)}
                  isRefreshing={isRefreshing}
                  showPalette={showPalette}
                  setShowPalette={setShowPalette}
               />;
      case 'watching':
        return (
          <DoramaList 
            title="Assistindo Agora" 
            doramas={currentUser.watching} 
            type="watching" 
            onAdd={() => openAddModal('watching')}
            onUpdate={handleUpdateDorama}
            onDelete={(id) => { setDoramaToDelete(id); setIsDeleteModalOpen(true); }}
            onEdit={openEditModal}
          />
        );
      case 'favorites':
        return (
          <DoramaList 
            title="Meus Favoritos" 
            doramas={currentUser.favorites} 
            type="favorites" 
            onAdd={() => openAddModal('favorites')}
            onUpdate={handleUpdateDorama}
            onDelete={(id) => { setDoramaToDelete(id); setIsDeleteModalOpen(true); }}
            onEdit={openEditModal}
          />
        );
      case 'completed':
          return (
            <DoramaList 
              title="Doramas Finalizados" 
              doramas={currentUser.completed} 
              type="completed" 
              onAdd={() => openAddModal('completed')}
              onUpdate={handleUpdateDorama}
              onDelete={(id) => { setDoramaToDelete(id); setIsDeleteModalOpen(true); }}
              onEdit={openEditModal}
            />
          );
      case 'games':
        return <GamesHub user={currentUser} onSaveGame={handleSaveGame} />;
      default:
        return null;
    }
  };

  const NavItem = ({ id, icon: Icon, label }: any) => {
      const isActive = activeTab === id;
      return (
          <button 
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center w-full h-full relative transition-all duration-300 ${isActive ? '-translate-y-2' : ''}`}
          >
              <div className={`p-3 rounded-full transition-all duration-300 shadow-sm ${isActive ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-pink-200 shadow-lg scale-110' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                  <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
              </div>
              {isActive && (
                  <span className="absolute -bottom-4 text-[10px] font-bold text-pink-600 animate-fade-in tracking-tight">
                      {label}
                  </span>
              )}
          </button>
      );
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto shadow-2xl relative overflow-hidden flex flex-col font-sans">
      {isTestSession && (
         <div className="bg-indigo-600 text-white text-xs text-center py-1 font-bold z-50 sticky top-0">
             MODO TESTE GRÁTIS - SESSÃO ENCERRA EM BREVE
         </div>
      )}
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* HEADER */}
      <div className="bg-white/95 backdrop-blur-md p-4 shadow-sm flex justify-between items-center z-30 sticky top-0 border-b border-gray-100 shrink-0">
          <div className="flex flex-col">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-1 font-sans">
                  EuDorama <Sparkles className="w-4 h-4 text-pink-500 fill-pink-500" />
              </h1>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest -mt-1 ml-0.5">Clube Exclusivo</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPalette(!showPalette)} className="flex items-center gap-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-all border border-gray-200 active:scale-95">
                <Palette className="w-4 h-4" /> <span className="hidden sm:inline">Tema</span>
            </button>
            <button onClick={() => handleRefreshSession(false)} disabled={isRefreshing} className="flex items-center gap-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-all border border-gray-200 disabled:opacity-50 active:scale-95">
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> <span className="hidden sm:inline">Dados</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all border border-red-100 active:scale-95">
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

      <main className={`flex-1 relative overflow-hidden pb-28`}>
           <div className="h-full overflow-y-auto scrollbar-hide">{renderContent()}</div>
      </main>

      {isSupportOpen && (
          <div className="fixed inset-0 z-[60] bg-white animate-slide-up">
              <SupportChat user={currentUser} onClose={() => setIsSupportOpen(false)} />
          </div>
      )}

      {showNameModal && <NameModal user={currentUser} onNameSaved={handleNameSaved} />}

      {isCheckoutOpen && (
        <CheckoutModal 
            onClose={() => setIsCheckoutOpen(false)} 
            user={currentUser}
            type={checkoutType}
            targetService={checkoutTargetService || undefined}
        />
      )}

      {/* FABs */}
      {!isSupportOpen && !isCheckoutOpen && activeTab !== 'games' && !showNameModal && (
        <div className="fixed bottom-28 right-4 z-40 flex flex-col gap-4 items-center pointer-events-none">
            <div className="pointer-events-auto flex flex-col gap-4 items-end">
                <div className="relative group">
                   <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                       Caixinha de Natal
                   </div>
                   <button onClick={() => handleOpenCheckout('gift')} className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 border-4 border-white animate-bounce">
                        <Gift className="w-7 h-7" />
                    </button>
                </div>
                <div className="relative group">
                    <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                       Suporte Técnico
                    </div>
                    <a href="https://wa.me/558894875029?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20o%20Cliente%20EuDorama." target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 border-4 border-white">
                        <MessageCircle className="w-7 h-7" />
                    </a>
                </div>
            </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{getModalTitle()}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Dorama</label>
                    <input autoFocus className="w-full bg-white text-gray-900 border-2 border-gray-300 rounded-xl p-3 text-base focus:border-primary-500 outline-none" placeholder="Nome..." value={newDoramaName} onChange={(e) => setNewDoramaName(e.target.value)} />
                </div>
                
                {(modalType === 'watching' || modalType === 'completed') && editingDorama && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Temporada</label>
                            <input type="number" className="w-full bg-white text-gray-900 border-2 border-gray-300 rounded-xl p-3 text-base text-center outline-none" value={newDoramaSeason} onChange={(e) => setNewDoramaSeason(e.target.value)} min="1" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Total Ep.</label>
                            <input type="number" className="w-full bg-white text-gray-900 border-2 border-gray-300 rounded-xl p-3 text-base text-center outline-none" value={newDoramaTotalEp} onChange={(e) => setNewDoramaTotalEp(e.target.value)} min="1" max="999" />
                        </div>
                    </div>
                )}

                {modalType === 'favorites' && (
                    <div className="text-center">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Avaliação</label>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={() => setNewDoramaRating(star)} className="p-1 transform hover:scale-110 transition-transform">
                                    <Heart className={`w-8 h-8 ${star <= newDoramaRating ? 'text-red-500 fill-red-500' : 'text-gray-300'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button onClick={saveDorama} className="w-full bg-primary-600 text-white font-bold text-base py-3.5 rounded-xl hover:bg-primary-700 transition-colors shadow-lg mt-2">
                  {editingDorama ? 'Salvar' : 'Adicionar'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-bounce-in border-t-8 border-red-500">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-red-100 p-4 rounded-full"><AlertTriangle className="w-10 h-10 text-red-600" /></div>
              <h3 className="text-xl font-extrabold text-gray-900">Tem certeza?</h3>
              <p className="text-gray-600 text-sm">Essa ação não pode ser desfeita.</p>
              <div className="flex gap-3 w-full pt-2">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-gray-200 text-gray-800 font-bold py-3 rounded-xl">Cancelar</button>
                <button onClick={handleConfirmDelete} disabled={isDeleting} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl">{isDeleting ? "..." : "Excluir"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div className="fixed bottom-6 inset-x-0 z-40 px-4 flex justify-center pointer-events-none">
          <nav className="bg-white/90 backdrop-blur-lg border border-white/50 rounded-[2rem] shadow-2xl p-2 flex justify-between items-center w-full max-w-sm pointer-events-auto ring-1 ring-black/5">
              <NavItem id="home" icon={Home} label="Início" />
              <NavItem id="watching" icon={Tv2} label="Vendo" />
              <NavItem id="games" icon={Gamepad2} label="Jogos" />
              <NavItem id="favorites" icon={Heart} label="Amei" />
              <NavItem id="completed" icon={CheckCircle2} label="Fim" />
          </nav>
      </div>

    </div>
  );
};

export default App;

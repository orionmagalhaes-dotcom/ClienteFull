
import React, { useState } from 'react';
import { Dorama } from '../types';
import { Play, Heart, Plus, Check, MoreVertical, Edit3, Trash2, Tv, TrendingUp, Calendar, ChevronUp } from 'lucide-react';

interface DoramaListProps {
  title: string;
  doramas: Dorama[];
  type: 'favorites' | 'watching' | 'completed';
  onAdd: () => void;
  onUpdate?: (dorama: Dorama) => void;
  onDelete?: (doramaId: string) => void;
  onEdit?: (dorama: Dorama) => void; 
}

const DoramaList: React.FC<DoramaListProps> = ({ title, doramas, type, onAdd, onUpdate, onDelete, onEdit }) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Fecha o menu se clicar fora (simulação simples)
  const toggleMenu = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenMenuId(openMenuId === id ? null : id);
  };

  const getGradient = (doramaTitle: string) => {
      const gradients = [
          'from-pink-500 to-rose-500',
          'from-purple-500 to-indigo-500',
          'from-blue-500 to-cyan-500',
          'from-teal-400 to-emerald-500',
          'from-orange-400 to-amber-500'
      ];
      const index = doramaTitle.length % gradients.length;
      return gradients[index];
  };

  const calculateProgress = (current: number = 0, total: number = 16) => {
      const safeTotal = total === 0 ? 1 : total;
      return Math.min(100, Math.max(0, (current / safeTotal) * 100));
  };

  // Lógica: Avançar Episódio (Auto-expande o total se necessário)
  const handleEpPlus = (e: React.MouseEvent, dorama: Dorama) => {
      e.stopPropagation();
      if (onUpdate) {
          const nextEp = (dorama.episodesWatched || 0) + 1;
          // Se passar do total, atualiza o total automaticamente para não travar o usuário
          const currentTotal = dorama.totalEpisodes || 16;
          const newTotal = nextEp > currentTotal ? nextEp : currentTotal;

          onUpdate({ 
              ...dorama, 
              episodesWatched: nextEp,
              totalEpisodes: newTotal
          });
      }
  };

  // Lógica: Nova Temporada (Reseta Ep para 1)
  const handleSeasonPlus = (e: React.MouseEvent, dorama: Dorama) => {
      e.stopPropagation();
      if (onUpdate) {
          onUpdate({
              ...dorama,
              season: (dorama.season || 1) + 1,
              episodesWatched: 1 // Volta para o episódio 1
          });
      }
  };

  return (
    <div className="space-y-6 pb-32">
      {/* HEADER ELEGANTE */}
      <div className="flex justify-between items-end px-6 pt-6 pb-2">
        <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-1">
              {title}
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                {doramas.length} {doramas.length === 1 ? 'Título' : 'Títulos'}
            </p>
        </div>
        <button 
          onClick={onAdd}
          className="bg-gray-900 text-white p-3 rounded-2xl shadow-lg shadow-gray-200 hover:bg-black transition-all active:scale-95 group"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      {/* EMPTY STATE */}
      {doramas.length === 0 ? (
        <div className="mx-6 mt-10 flex flex-col items-center text-center p-8 bg-white border-2 border-dashed border-gray-200 rounded-3xl">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
              {type === 'favorites' ? <Heart className="w-8 h-8 text-gray-300" /> : <Tv className="w-8 h-8 text-gray-300" />}
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Nada por aqui...</h3>
          <p className="text-gray-500 text-sm mb-6 mt-1">Sua lista está vazia. Que tal começar um novo dorama hoje?</p>
          <button 
            onClick={onAdd}
            className="text-sm font-bold text-pink-600 bg-pink-50 px-6 py-3 rounded-xl hover:bg-pink-100 transition-colors"
          >
            Adicionar Agora
          </button>
        </div>
      ) : (
        /* LISTA DE CARDS */
        <div className="flex flex-col gap-4 px-4">
          {doramas.map((dorama) => {
            const progress = calculateProgress(dorama.episodesWatched, dorama.totalEpisodes);
            
            return (
                <div key={dorama.id} className="group relative bg-white rounded-3xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    
                    <div className="flex gap-4">
                        {/* POSTER (Generated) */}
                        <div className={`w-24 h-32 rounded-2xl bg-gradient-to-br ${getGradient(dorama.title)} flex items-center justify-center flex-shrink-0 shadow-inner relative overflow-hidden`}>
                            <span className="text-4xl font-black text-white opacity-20 select-none">
                                {dorama.title.charAt(0).toUpperCase()}
                            </span>
                            {/* Type Icon Overlay */}
                            <div className="absolute top-2 left-2 bg-black/20 backdrop-blur-sm p-1 rounded-lg">
                                {type === 'favorites' && <Heart className="w-3 h-3 text-white fill-white" />}
                                {type === 'watching' && <Play className="w-3 h-3 text-white fill-white" />}
                                {type === 'completed' && <Check className="w-3 h-3 text-white" />}
                            </div>
                        </div>

                        {/* INFO & CONTROLS */}
                        <div className="flex-1 flex flex-col justify-between py-1 min-w-0 relative">
                            
                            {/* MENU BUTTON (Absolute Top Right) */}
                            <div className="absolute top-0 right-0">
                                <button 
                                    onClick={(e) => toggleMenu(dorama.id, e)}
                                    className="p-1 text-gray-300 hover:text-gray-600 transition-colors"
                                >
                                    <MoreVertical className="w-5 h-5" />
                                </button>
                                {/* DROPDOWN MENU */}
                                {openMenuId === dorama.id && (
                                    <div className="absolute right-0 top-6 w-32 bg-white rounded-xl shadow-xl border border-gray-100 z-20 animate-fade-in overflow-hidden">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); onEdit && onEdit(dorama); }}
                                            className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Edit3 className="w-3 h-3" /> Editar
                                        </button>
                                        <div className="h-px bg-gray-100"></div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); onDelete && onDelete(dorama.id); }}
                                            className="w-full text-left px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-3 h-3" /> Excluir
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* TEXT INFO */}
                            <div className="pr-6">
                                <h3 className="font-bold text-gray-900 text-lg leading-tight truncate mb-1">
                                    {dorama.title}
                                </h3>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                                        {dorama.genre || 'Drama'}
                                    </span>
                                    {/* Mostra Temp se > 1 ou se estiver assistindo */}
                                    {(type === 'watching' || (dorama.season && dorama.season > 1)) && (
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <Tv className="w-3 h-3" /> T{dorama.season || 1}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* CONTEXTUAL FOOTER - CONTROLES INTELIGENTES */}
                            {type === 'watching' && (
                                <div className="mt-auto">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="flex flex-col">
                                            <p className="text-xs text-gray-400 font-bold mb-0.5">Progresso</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-sm font-black text-gray-800">Ep. {dorama.episodesWatched}</span>
                                                <span className="text-[10px] font-bold text-gray-300">/ {dorama.totalEpisodes}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            {/* Botão Nova Temporada */}
                                            <button 
                                                onClick={(e) => handleSeasonPlus(e, dorama)}
                                                className="bg-blue-50 text-blue-600 border border-blue-100 p-2 rounded-xl shadow-sm active:scale-95 transition-all group"
                                                title="Nova Temporada (Reseta Ep)"
                                            >
                                                <span className="flex items-center gap-1 text-[10px] font-black uppercase">
                                                    T{dorama.season ? dorama.season + 1 : 2} <ChevronUp className="w-3 h-3" />
                                                </span>
                                            </button>

                                            {/* Botão +1 Episódio */}
                                            <button 
                                                onClick={(e) => handleEpPlus(e, dorama)}
                                                className="bg-pink-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-md shadow-pink-200 active:scale-95 transition-all flex items-center gap-1 hover:bg-pink-700"
                                            >
                                                <Plus className="w-4 h-4" /> Ep {dorama.episodesWatched ? dorama.episodesWatched + 1 : 1}
                                            </button>
                                        </div>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500 ease-out"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {type === 'favorites' && (
                                <div className="mt-auto">
                                    <p className="text-xs text-gray-400 font-bold mb-1">Minha Avaliação</p>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Heart 
                                                key={star} 
                                                className={`w-5 h-5 ${star <= (dorama.rating || 0) ? 'text-red-500 fill-red-500' : 'text-gray-200 fill-gray-100'}`} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {type === 'completed' && (
                                <div className="mt-auto">
                                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-xl text-xs font-bold w-full">
                                        <Check className="w-4 h-4 bg-green-200 rounded-full p-0.5 text-green-700" />
                                        <span>Finalizado!</span>
                                        <div className="ml-auto flex gap-0.5">
                                            {[...Array(dorama.rating || 5)].map((_, i) => (
                                                <div key={i} className="w-1.5 h-1.5 bg-green-300 rounded-full"></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            );
          })}
        </div>
      )}
      
      {/* Click outside to close menu overlay */}
      {openMenuId && (
          <div className="fixed inset-0 z-10 bg-transparent" onClick={() => setOpenMenuId(null)}></div>
      )}
    </div>
  );
};

export default DoramaList;

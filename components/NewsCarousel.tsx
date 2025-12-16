
import React, { useState, useEffect } from 'react';
import { getDoramaNews } from '../services/newsService';
import { NewsItem } from '../types';
import { ExternalLink, Loader2, ImageOff } from 'lucide-react';

const NewsCarousel: React.FC = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Fallback seguro se a imagem carregada falhar
    const SAFE_FALLBACK = "https://images.unsplash.com/photo-1538485399081-7191377e8241?q=80&w=800&auto=format&fit=crop";

    useEffect(() => {
        const load = async () => {
            const data = await getDoramaNews();
            setNews(data);
            setLoading(false);
        };
        load();
    }, []);

    // Auto-rotate
    useEffect(() => {
        if (news.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % Math.min(news.length, 3)); // Limit to first 3
        }, 5000); // 5 seconds
        return () => clearInterval(interval);
    }, [news]);

    if (loading) {
        return (
            <div className="w-full h-56 bg-gray-100 rounded-3xl animate-pulse flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
        );
    }

    if (news.length === 0) return null;

    const displayNews = news.slice(0, 3);
    const currentItem = displayNews[currentIndex];

    return (
        <div className="relative w-full h-56 rounded-3xl overflow-hidden shadow-xl group bg-gray-900">
            {/* Background Image */}
            <div className="absolute inset-0">
                <img 
                    src={currentItem.image} 
                    alt={currentItem.title}
                    className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                        // Se a imagem falhar, substitui pelo fallback seguro
                        e.currentTarget.src = SAFE_FALLBACK;
                        e.currentTarget.onerror = null; // Previne loop
                    }}
                />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-5 flex flex-col justify-end">
                <div className="transform transition-all duration-500 translate-y-0">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-primary-600 text-white text-[10px] font-bold uppercase tracking-wider mb-2 shadow-sm">
                        Notícias
                    </span>
                    <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-1 drop-shadow-md">
                        {currentItem.title}
                    </h3>
                    <div className="flex justify-between items-end mt-2">
                        <p className="text-gray-300 text-xs font-medium">
                           {new Date(currentItem.pubDate).toLocaleDateString('pt-BR')} • {currentItem.source || 'Google'}
                        </p>
                        <a 
                            href={currentItem.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center transition-colors border border-white/10"
                        >
                            Ler mais <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Indicators */}
            <div className="absolute top-4 right-4 flex gap-1 z-10">
                {displayNews.map((_, idx) => (
                    <div 
                        key={idx} 
                        className={`h-1 rounded-full transition-all duration-300 shadow-sm ${idx === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default NewsCarousel;

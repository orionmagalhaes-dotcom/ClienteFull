
import React, { useState, useEffect, useRef } from 'react';
import { Heart, X, Trophy, Play, RefreshCw, Gift, Bomb } from 'lucide-react';
import { User } from '../types';

interface GameItem {
    id: number;
    x: number;
    y: number;
    type: 'heart' | 'gift' | 'broken' | 'bomb';
    speed: number;
}

interface DoramaGameProps {
    onClose: () => void;
    user?: User;
    onSave?: (score: number) => void;
}

const DoramaGame: React.FC<DoramaGameProps> = ({ onClose, user, onSave }) => {
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [items, setItems] = useState<GameItem[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>();
    const lastSpawnTime = useRef<number>(0);

    const SPAWN_RATE = 800; // ms

    // Load High Score
    useEffect(() => {
        if (user && user.gameProgress && user.gameProgress['chuva']) {
            setHighScore(user.gameProgress['chuva'].highScore || 0);
        }
    }, [user]);

    // Save Game Over
    useEffect(() => {
        if (gameOver) {
            if (score > highScore) {
                setHighScore(score);
                if (onSave) {
                    onSave(score);
                }
            }
        }
    }, [gameOver, score]);

    const spawnItem = () => {
        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        
        const rand = Math.random();
        let type: GameItem['type'] = 'heart';
        if (rand > 0.7) type = 'gift';
        if (rand > 0.85) type = 'broken';
        if (rand > 0.95) type = 'bomb';

        const newItem: GameItem = {
            id: Date.now() + Math.random(),
            x: Math.random() * (width - 50), // 50px item width
            y: -60,
            type,
            speed: 2 + Math.random() * 3
        };

        setItems(prev => [...prev, newItem]);
    };

    const updateGame = (timestamp: number) => {
        if (!isPlaying) return;

        if (timestamp - lastSpawnTime.current > SPAWN_RATE) {
            spawnItem();
            lastSpawnTime.current = timestamp;
        }

        setItems(prevItems => {
            const nextItems = prevItems
                .map(item => ({ ...item, y: item.y + item.speed }))
                .filter(item => {
                    // Remove items that fell off screen
                    if (item.y > window.innerHeight) {
                        return false; 
                    }
                    return true;
                });
            return nextItems;
        });

        animationRef.current = requestAnimationFrame(updateGame);
    };

    useEffect(() => {
        if (isPlaying && !gameOver) {
            lastSpawnTime.current = performance.now();
            animationRef.current = requestAnimationFrame(updateGame);
        } else {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        }
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPlaying, gameOver]);

    useEffect(() => {
        if (lives <= 0) {
            setGameOver(true);
            setIsPlaying(false);
        }
    }, [lives]);

    const handleTouch = (id: number, type: GameItem['type']) => {
        if (gameOver) return;

        if (type === 'heart') setScore(s => s + 10);
        if (type === 'gift') setScore(s => s + 50);
        if (type === 'broken') {
            setLives(l => l - 1);
        }
        if (type === 'bomb') {
            setLives(0);
        }

        setItems(prev => prev.filter(i => i.id !== id));
    };

    const startGame = () => {
        setScore(0);
        setLives(3);
        setItems([]);
        setGameOver(false);
        setIsPlaying(true);
    };

    const getItemIcon = (type: string) => {
        switch(type) {
            case 'gift': return <Gift className="w-8 h-8 text-yellow-600 fill-yellow-300 animate-bounce" />;
            case 'broken': return <Heart className="w-8 h-8 text-gray-400 fill-gray-300 rotate-12" />; 
            case 'bomb': return <Bomb className="w-8 h-8 text-black fill-gray-800 animate-pulse" />;
            default: return <Heart className="w-8 h-8 text-pink-500 fill-pink-500 drop-shadow-md" />;
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-gradient-to-b from-pink-100 to-purple-200 overflow-hidden flex flex-col font-sans touch-none select-none">
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-white/30 backdrop-blur-md shadow-sm z-10">
                <div className="flex gap-4">
                    <div className="bg-white px-3 py-1 rounded-full shadow-sm flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="font-extrabold text-gray-800">{score}</span>
                    </div>
                    {highScore > 0 && (
                        <div className="bg-yellow-100 px-3 py-1 rounded-full shadow-sm flex items-center gap-1 border border-yellow-200">
                            <span className="text-[10px] font-bold text-yellow-700 uppercase">Recorde:</span>
                            <span className="font-extrabold text-yellow-900">{highScore}</span>
                        </div>
                    )}
                    <div className="flex gap-1 items-center">
                        {[...Array(3)].map((_, i) => (
                            <Heart key={i} className={`w-5 h-5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-300'}`} />
                        ))}
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* Game Area */}
            <div ref={containerRef} className="flex-1 relative overflow-hidden">
                {items.map(item => (
                    <div
                        key={item.id}
                        className="absolute cursor-pointer transition-transform active:scale-90 p-4"
                        style={{ 
                            transform: `translate(${item.x}px, ${item.y}px)`,
                            zIndex: 20
                        }}
                        onPointerDown={(e) => {
                            e.preventDefault(); // Prevent default touch actions
                            handleTouch(item.id, item.type);
                        }}
                    >
                        {getItemIcon(item.type)}
                    </div>
                ))}

                {/* Start Screen */}
                {!isPlaying && !gameOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-xs animate-bounce-in border-4 border-pink-400">
                            <h1 className="text-3xl font-black text-pink-600 mb-2">Chuva de Amor</h1>
                            <p className="text-gray-600 mb-6 text-sm">
                                Colete Corações <Heart className="w-3 h-3 inline text-pink-500"/> e Presentes <Gift className="w-3 h-3 inline text-yellow-500"/>. 
                                <br/>Evite corações cinza e bombas!
                            </p>
                            <button onClick={startGame} className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center text-lg transition-transform active:scale-95">
                                <Play className="w-6 h-6 mr-2 fill-current" /> JOGAR
                            </button>
                        </div>
                    </div>
                )}

                {/* Game Over Screen */}
                {gameOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-30">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-xs animate-fade-in border-t-8 border-red-500">
                            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trophy className="w-8 h-8 text-red-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">Fim de Jogo!</h2>
                            <p className="text-gray-500 mb-4">Sua pontuação final:</p>
                            <div className="text-5xl font-black text-pink-600 mb-6">{score}</div>
                            
                            {score >= highScore && score > 0 && (
                                <div className="bg-yellow-100 text-yellow-800 font-bold p-2 rounded-lg mb-4 text-sm animate-pulse">
                                    NOVO RECORDE SALVO! 🏆
                                </div>
                            )}

                            <div className="space-y-3">
                                <button onClick={startGame} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center transition-transform active:scale-95">
                                    <RefreshCw className="w-5 h-5 mr-2" /> Tentar Novamente
                                </button>
                                <button onClick={onClose} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-xl transition-colors">
                                    Sair
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoramaGame;

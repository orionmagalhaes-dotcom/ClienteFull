
import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Heart, Gift, HelpCircle, Trophy, Sparkles, Smile, Hand, Scissors, Brain, RefreshCw, X, ChevronRight, Music, Clock, User as UserIcon, Film, Search, Star, MessageCircle, AlertCircle, Quote, Languages, Palette, ToggleLeft } from 'lucide-react';
import DoramaGame from './DoramaGame';
import { User } from '../types';

interface GamesHubProps {
    user: User;
    onSaveGame: (gameId: string, data: any) => void;
}

const GamesHub: React.FC<GamesHubProps> = ({ user, onSaveGame }) => {
    const [selectedGame, setSelectedGame] = useState<string | null>(null);

    const GAMES = [
        // EXISTING 5
        { id: 'chuva', title: 'Chuva de Amor', icon: <Heart className="w-6 h-6 text-pink-500" />, desc: 'Pegue corações!', cat: 'Ação' },
        { id: 'quiz_geral', title: 'Quiz Dorameira', icon: <HelpCircle className="w-6 h-6 text-indigo-500" />, desc: 'Teste geral.', cat: 'Quiz' },
        { id: 'memoria', title: 'Memória do Oppa', icon: <Brain className="w-6 h-6 text-green-500" />, desc: 'Encontre os pares.', cat: 'Memória' },
        { id: 'sorte', title: 'Sorte do Dia', icon: <Sparkles className="w-6 h-6 text-yellow-500" />, desc: 'Sua mensagem.', cat: 'Sorte' },
        { id: 'jokenpo', title: 'Jokenpô Coreano', icon: <Hand className="w-6 h-6 text-orange-500" />, desc: 'Gawi Bawi Bo!', cat: 'Clássico' },
        
        // NEW 20 GAMES
        { id: 'forca', title: 'Forca Dorama', icon: <div className="font-bold text-gray-700 text-lg">A_C</div>, desc: 'Adivinhe o nome.', cat: 'Palavras' },
        { id: 'quiz_ost', title: 'Quiz de OSTs', icon: <Music className="w-6 h-6 text-purple-500" />, desc: 'Conhece a música?', cat: 'Quiz' },
        { id: 'quiz_ator', title: 'Quiz de Atores', icon: <UserIcon className="w-6 h-6 text-blue-500" />, desc: 'Quem é esse?', cat: 'Quiz' },
        { id: 'quiz_emoji', title: 'Dorama por Emoji', icon: <Smile className="w-6 h-6 text-yellow-600" />, desc: 'Decifre o enigma.', cat: 'Quiz' },
        { id: 'love_alarm', title: 'Love Alarm', icon: <Heart className="w-6 h-6 text-red-600 animate-pulse" />, desc: 'Alguém te ama?', cat: 'Sorte' },
        { id: 'miojo', title: 'Timer de Miojo', icon: <Clock className="w-6 h-6 text-orange-400" />, desc: 'Não deixe passar!', cat: 'Util' },
        { id: 'biscoito', title: 'Biscoito da Sorte', icon: <Gift className="w-6 h-6 text-yellow-700" />, desc: 'Quebre e leia.', cat: 'Sorte' },
        { id: 'clicker', title: 'Corações para o Oppa', icon: <Heart className="w-6 h-6 text-pink-400" />, desc: 'Clique sem parar!', cat: 'Clicker' },
        { id: 'nome_coreano', title: 'Gerador de Nome', icon: <Languages className="w-6 h-6 text-teal-600" />, desc: 'Qual seu nome KR?', cat: 'Fun' },
        { id: 'scramble', title: 'Sopa de Letrinhas', icon: <Search className="w-6 h-6 text-gray-600" />, desc: 'Desembaralhe.', cat: 'Palavras' },
        { id: 'role', title: 'Qual seu Papel?', icon: <Film className="w-6 h-6 text-indigo-400" />, desc: 'Vilã ou Mocinha?', cat: 'Sorte' },
        { id: 'trote', title: 'Chamada Falsa', icon: <MessageCircle className="w-6 h-6 text-green-500" />, desc: 'O Oppa ligou!', cat: 'Fun' },
        { id: 'casal', title: 'Calculadora de Amor', icon: <Heart className="w-6 h-6 text-red-400" />, desc: 'Dá match?', cat: 'Fun' },
        { id: 'verdade', title: 'Verdade ou Desafio', icon: <AlertCircle className="w-6 h-6 text-purple-600" />, desc: 'Versão Dorama.', cat: 'Social' },
        { id: 'frase', title: 'Complete a Frase', icon: <Quote className="w-6 h-6 text-gray-500" />, desc: 'Clichês clássicos.', cat: 'Quiz' },
        { id: 'tradutor', title: 'Mini Dicionário', icon: <Languages className="w-6 h-6 text-blue-400" />, desc: 'O que é Daebak?', cat: 'Edu' },
        { id: 'genero', title: 'Roleta de Gênero', icon: <Palette className="w-6 h-6 text-pink-600" />, desc: 'O que assistir?', cat: 'Util' },
        { id: 'bingo', title: 'Bingo do Clichê', icon: <div className="border border-black px-1 font-bold text-xs">B</div>, desc: 'Cartela rápida.', cat: 'Social' },
        { id: 'reflexo', title: 'Teste de Reflexo', icon: <ZapIcon className="w-6 h-6 text-yellow-400" />, desc: 'Segure o Beijo!', cat: 'Ação' },
        { id: 'escolha', title: 'Isso ou Aquilo?', icon: <ToggleLeft className="w-6 h-6 text-cyan-600" />, desc: 'Faça escolhas.', cat: 'Social' },
    ];

    const renderGame = () => {
        switch (selectedGame) {
            case 'chuva': return <DoramaGame user={user} onSave={(score) => onSaveGame('chuva', { highScore: score })} onClose={() => setSelectedGame(null)} />;
            case 'quiz_geral': return <QuizGame type="general" onBack={() => setSelectedGame(null)} />;
            case 'memoria': return <MemoryGame onBack={() => setSelectedGame(null)} />;
            case 'sorte': return <LuckyGame onBack={() => setSelectedGame(null)} />;
            case 'jokenpo': return <JokenpoGame onBack={() => setSelectedGame(null)} />;
            
            // New Games Logic Mapping
            case 'forca': return <HangmanGame onBack={() => setSelectedGame(null)} />;
            case 'quiz_ost': return <QuizGame type="ost" onBack={() => setSelectedGame(null)} />;
            case 'quiz_ator': return <QuizGame type="actor" onBack={() => setSelectedGame(null)} />;
            case 'quiz_emoji': return <QuizGame type="emoji" onBack={() => setSelectedGame(null)} />;
            case 'love_alarm': return <SimpleRandomResult title="Love Alarm" items={['10% - Só amizade', '50% - Talvez...', '99% - ALMA GÊMEA!', '0% - Nem te viu', '100% - CASAMENTO!']} icon={<Heart className="w-16 h-16 text-red-600 animate-pulse"/>} onBack={() => setSelectedGame(null)} />;
            case 'miojo': return <TimerGame onBack={() => setSelectedGame(null)} />;
            case 'biscoito': return <SimpleRandomResult title="Biscoito da Sorte" items={['Sorte no amor hoje!', 'Cuidado com a sogra.', 'Um novo dorama vai roubar seu coração.', 'Coma algo gostoso hoje.', 'O Oppa vai notar você (nos sonhos).']} icon={<Gift className="w-16 h-16 text-yellow-600"/>} onBack={() => setSelectedGame(null)} />;
            case 'clicker': return <ClickerGame onBack={() => setSelectedGame(null)} />;
            case 'nome_coreano': return <KoreanNameGen onBack={() => setSelectedGame(null)} />;
            case 'scramble': return <ScrambleGame onBack={() => setSelectedGame(null)} />;
            case 'role': return <SimpleRandomResult title="Seu Papel no Dorama" items={['A Mocinha Pobre e Batalhadora', 'A Vilã Rica e Malvada', 'A Melhor Amiga Engraçada', 'A Mãe que oferece dinheiro para afastar', 'A Dona do Restaurante de Frango']} icon={<Film className="w-16 h-16 text-indigo-500"/>} onBack={() => setSelectedGame(null)} />;
            case 'trote': return <FakeCall onBack={() => setSelectedGame(null)} />;
            case 'casal': return <LoveCalc onBack={() => setSelectedGame(null)} />;
            case 'verdade': return <SimpleRandomResult title="Verdade ou Desafio" items={['Verdade: Qual dorama você tem vergonha de ter gostado?', 'Desafio: Imite um "Omo!" exagerado agora.', 'Verdade: Qual ator você beijaria?', 'Desafio: Mande "Saranghae" para o último contato.', 'Verdade: Já chorou por mais de 1 hora num final?']} icon={<AlertCircle className="w-16 h-16 text-purple-500"/>} onBack={() => setSelectedGame(null)} />;
            case 'frase': return <QuizGame type="quotes" onBack={() => setSelectedGame(null)} />;
            case 'tradutor': return <DictionaryGame onBack={() => setSelectedGame(null)} />;
            case 'genero': return <SimpleRandomResult title="O que assistir?" items={['Comédia Romântica', 'Suspense/Thriller', 'Histórico (Sageuk)', 'Fantasia', 'Melodrama (Prepare o lenço)', 'Ação Policial']} icon={<Palette className="w-16 h-16 text-pink-500"/>} onBack={() => setSelectedGame(null)} />;
            case 'bingo': return <BingoGame onBack={() => setSelectedGame(null)} />;
            case 'reflexo': return <ReflexGame onBack={() => setSelectedGame(null)} />;
            case 'escolha': return <ThisOrThat onBack={() => setSelectedGame(null)} />;
            default: return null;
        }
    };

    if (selectedGame) {
        return (
            <div className="fixed inset-0 z-[60] bg-white flex flex-col h-full w-full overflow-hidden">
                {renderGame()}
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 pb-28">
            <header className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-2xl">
                    <Gamepad2 className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900">Arcade Dorameira</h1>
                    <p className="text-sm text-gray-500">25 Jogos para passar o tempo!</p>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-3">
                {GAMES.map(game => (
                    <button 
                        key={game.id}
                        onClick={() => setSelectedGame(game.id)}
                        className={`bg-white border border-gray-100 p-4 rounded-3xl flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 text-center h-32`}
                    >
                        <div className="bg-gray-50 p-2 rounded-2xl mb-2 text-gray-700">
                            {game.icon}
                        </div>
                        <h3 className="font-bold text-gray-800 text-sm leading-tight">{game.title}</h3>
                        <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{game.cat}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

const ZapIcon = ({className}: {className:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
);

// --- GENERIC COMPONENTS ---

const Header = ({ title, onBack, colorClass = "text-gray-900" }: any) => (
    <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5 text-gray-600" /></button>
        <span className={`font-extrabold text-xl ${colorClass}`}>{title}</span>
        <div className="w-9"></div> 
    </div>
);

// 1. SIMPLE RANDOM RESULT (Used for Love Alarm, Cookie, Role, Truth/Dare, Genre)
const SimpleRandomResult = ({ title, items, icon, onBack }: any) => {
    const [result, setResult] = useState<string | null>(null);
    const [spinning, setSpinning] = useState(false);

    const spin = () => {
        setSpinning(true);
        setResult(null);
        setTimeout(() => {
            setResult(items[Math.floor(Math.random() * items.length)]);
            setSpinning(false);
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100">
            <Header title={title} onBack={onBack} />
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className={`mb-8 transition-all duration-700 ${spinning ? 'animate-spin scale-110' : 'scale-100'}`}>
                    {icon}
                </div>
                
                {result ? (
                    <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-primary-100 animate-bounce-in">
                        <p className="text-2xl font-black text-gray-800">{result}</p>
                    </div>
                ) : (
                    <p className="text-gray-500 font-medium">Toque no botão para descobrir!</p>
                )}

                <button onClick={spin} disabled={spinning} className="mt-12 w-full max-w-xs bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 disabled:opacity-50">
                    {spinning ? 'Processando...' : 'Sortear Agora'}
                </button>
            </div>
        </div>
    );
};

// 2. QUIZ ENGINE (Handles General, OST, Actors, Emoji, Quotes)
const QuizGame = ({ type, onBack }: { type: 'general' | 'ost' | 'actor' | 'emoji' | 'quotes', onBack: () => void }) => {
    const [qIndex, setQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);

    const DATASETS = {
        general: [
            { q: "Qual dorama tem um 'Goblin'?", o: ["Goblin", "Vincenzo", "My Demon"], a: 0 },
            { q: "Quem é a advogada extraordinária?", o: ["Woo Young-woo", "Hong Cha-young", "Go Moon-young"], a: 0 },
            { q: "Onde se passa 'Pousando no Amor'?", o: ["Coreia do Sul", "Coreia do Norte", "Japão"], a: 1 },
        ],
        ost: [
            { q: "'You are my destiny...' é de qual dorama?", o: ["My Love from the Star", "Descendants of the Sun", "Goblin"], a: 0 },
            { q: "'Stay with me...' (Chanyeol & Punch)", o: ["Goblin", "Moon Lovers", "Start-Up"], a: 0 },
            { q: "'Beautiful' (Crush)", o: ["Goblin", "It's Okay to Not Be Okay", "Strong Woman"], a: 0 },
        ],
        actor: [
            { q: "Ator principal de 'Itaewon Class'?", o: ["Park Seo-joon", "Song Joong-ki", "Hyun Bin"], a: 0 },
            { q: "Atriz de 'Tudo Bem Não Ser Normal'?", o: ["Seo Ye-ji", "Park Shin-hye", "IU"], a: 0 },
            { q: "Quem fez o Ceifador em Goblin?", o: ["Gong Yoo", "Lee Dong-wook", "Lee Min-ho"], a: 1 },
        ],
        emoji: [
            { q: "🧜‍♀️🌊🤴", o: ["A Lenda do Mar Azul", "Goblin", "Hometown Cha-Cha-Cha"], a: 0 },
            { q: "🧟‍♂️🏫🩸", o: ["All of Us Are Dead", "Sweet Home", "Kingdom"], a: 0 },
            { q: "🦑💸☠️", o: ["Round 6", "My Name", "Extracurricular"], a: 0 },
        ],
        quotes: [
            { q: "Complete: 'Do you like ___?' (Weightlifting Fairy)", o: ["Messi", "Soju", "Kimchi"], a: 0 },
            { q: "Complete: 'O amor é como um ___' (Pousando no Amor)", o: ["Acidente", "Presente", "Tornado"], a: 0 },
            { q: "Frase clássica de rejeição:", o: ["Vamos comer lámen?", "Sinto muito, só te vejo como irmã.", "Você come bem."], a: 1 },
        ]
    };

    const questions = DATASETS[type];

    const handleAnswer = (idx: number) => {
        if (idx === questions[qIndex].a) setScore(s => s + 1);
        if (qIndex + 1 < questions.length) setQIndex(i => i + 1);
        else setFinished(true);
    };

    return (
        <div className="flex flex-col h-full bg-indigo-50">
            <Header title="Quiz Time" onBack={onBack} colorClass="text-indigo-900" />
            {finished ? (
                <div className="text-center mt-20 p-6">
                    <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-indigo-900">Fim!</h2>
                    <p className="text-xl mt-2">Você acertou {score} de {questions.length}!</p>
                    <button onClick={onBack} className="mt-8 bg-indigo-600 text-white py-3 px-8 rounded-xl font-bold">Sair</button>
                </div>
            ) : (
                <div className="flex-1 flex flex-col justify-center p-6">
                    <div className="bg-white p-6 rounded-3xl shadow-lg text-center mb-8">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Pergunta {qIndex + 1}/{questions.length}</span>
                        <h3 className="text-xl font-bold text-gray-800 mt-2">{questions[qIndex].q}</h3>
                    </div>
                    <div className="space-y-3">
                        {questions[qIndex].o.map((opt, idx) => (
                            <button key={idx} onClick={() => handleAnswer(idx)} className="w-full bg-white border-2 border-indigo-100 hover:border-indigo-500 text-indigo-900 font-bold py-4 rounded-xl transition-all">
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// 3. HANGMAN
const HangmanGame = ({ onBack }: { onBack: () => void }) => {
    const WORDS = ["VINCENZO", "GOBLIN", "HEALER", "STARTUP", "KINGDOM"];
    const [word, setWord] = useState(WORDS[0]);
    const [guessed, setGuessed] = useState<string[]>([]);
    const [errors, setErrors] = useState(0);

    useEffect(() => { setWord(WORDS[Math.floor(Math.random() * WORDS.length)]); }, []);

    const handleGuess = (letter: string) => {
        if (guessed.includes(letter) || errors >= 6) return;
        setGuessed([...guessed, letter]);
        if (!word.includes(letter)) setErrors(e => e + 1);
    };

    const displayWord = word.split('').map(l => guessed.includes(l) ? l : '_').join(' ');
    const isWon = !displayWord.includes('_');
    const isLost = errors >= 6;

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    return (
        <div className="flex flex-col h-full bg-blue-50">
            <Header title="Forca Dorama" onBack={onBack} colorClass="text-blue-900" />
            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="text-4xl font-mono tracking-widest font-bold mb-8 text-blue-800">{displayWord}</div>
                <div className="mb-8 text-red-500 font-bold">Erros: {errors}/6</div>
                
                {(isWon || isLost) ? (
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">{isWon ? "Você Venceu!" : `Perdeu! Era: ${word}`}</h2>
                        <button onClick={onBack} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Sair</button>
                    </div>
                ) : (
                    <div className="flex flex-wrap justify-center gap-2">
                        {alphabet.map(l => (
                            <button 
                                key={l} 
                                onClick={() => handleGuess(l)} 
                                disabled={guessed.includes(l)}
                                className={`w-8 h-10 rounded font-bold ${guessed.includes(l) ? 'bg-gray-200 text-gray-400' : 'bg-white shadow text-blue-900'}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// 4. CLICKER
const ClickerGame = ({ onBack }: { onBack: () => void }) => {
    const [hearts, setHearts] = useState(0);
    return (
        <div className="flex flex-col h-full bg-pink-50 items-center justify-center">
            <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-white rounded-full"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-pink-800 mb-2">Dê amor ao Oppa!</h2>
            <div className="text-6xl font-black text-pink-600 mb-8">{hearts}</div>
            <button 
                onClick={() => setHearts(h => h + 1)}
                className="active:scale-90 transition-transform bg-red-500 text-white p-8 rounded-full shadow-2xl border-4 border-white"
            >
                <Heart className="w-20 h-20 fill-current" />
            </button>
            <p className="mt-4 text-gray-500 text-sm">Toque rápido!</p>
        </div>
    );
};

// 5. TIMER GAME (Miojo)
const TimerGame = ({ onBack }: { onBack: () => void }) => {
    const [time, setTime] = useState(180); // 3 minutes
    const [active, setActive] = useState(false);

    useEffect(() => {
        let interval: any = null;
        if (active && time > 0) {
            interval = setInterval(() => setTime(t => t - 1), 1000);
        } else if (time === 0) {
            setActive(false);
            alert("Miojo Pronto! 🍜");
        }
        return () => clearInterval(interval);
    }, [active, time]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="flex flex-col h-full bg-orange-50 items-center justify-center">
            <Header title="Hora do Miojo" onBack={onBack} />
            <div className="flex-1 flex flex-col items-center justify-center">
                <Clock className="w-24 h-24 text-orange-500 mb-6" />
                <div className="text-7xl font-mono font-black text-gray-800 mb-8">{formatTime(time)}</div>
                <div className="flex gap-4">
                    <button onClick={() => setActive(!active)} className="bg-orange-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg">
                        {active ? 'Pausar' : 'Iniciar'}
                    </button>
                    <button onClick={() => { setActive(false); setTime(180); }} className="bg-gray-200 text-gray-700 px-8 py-3 rounded-xl font-bold">
                        Resetar
                    </button>
                </div>
            </div>
        </div>
    );
};

// 6. KOREAN NAME GEN
const KoreanNameGen = ({ onBack }: { onBack: () => void }) => {
    const [name, setName] = useState<string | null>(null);
    const SURNAMES = ['Kim', 'Lee', 'Park', 'Choi', 'Jeong'];
    const FIRST = ['Min', 'Seo', 'Ji', 'Ha', 'So'];
    const LAST = ['Jun', 'Yeon', 'Woo', 'Hyun', 'Eun'];

    const generate = () => {
        const s = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
        const f = FIRST[Math.floor(Math.random() * FIRST.length)];
        const l = LAST[Math.floor(Math.random() * LAST.length)];
        setName(`${s} ${f}-${l}`);
    };

    return (
        <div className="flex flex-col h-full bg-teal-50 items-center justify-center">
            <Header title="Nome Coreano" onBack={onBack} />
            <div className="flex-1 flex flex-col items-center justify-center w-full p-6">
                <div className="bg-white w-full max-w-xs p-8 rounded-3xl shadow-lg text-center mb-8 border-2 border-teal-100">
                    <p className="text-gray-400 text-sm uppercase font-bold mb-2">Seu nome é:</p>
                    <p className="text-3xl font-black text-teal-800">{name || '???'}</p>
                </div>
                <button onClick={generate} className="bg-teal-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg">
                    Gerar Nome
                </button>
            </div>
        </div>
    );
};

// 7. SCRAMBLE
const ScrambleGame = ({ onBack }: { onBack: () => void }) => {
    const WORDS = [{w: 'DORAMA', s: 'AMADOR'}, {w: 'OPPA', s: 'PAOP'}, {w: 'KIMCHI', s: 'HIKMIC'}, {w: 'SOJU', s: 'JUSO'}];
    const [level, setLevel] = useState(0);
    const [input, setInput] = useState('');
    
    const check = () => {
        if (input.toUpperCase() === WORDS[level].w) {
            alert("Correto!");
            setInput('');
            if (level < WORDS.length - 1) setLevel(l => l + 1);
            else { alert("Você venceu tudo!"); onBack(); }
        } else {
            alert("Tente de novo");
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 items-center justify-center p-6">
            <Header title="Sopa de Letras" onBack={onBack} />
            <div className="flex-1 flex flex-col items-center justify-center w-full">
                <p className="text-sm text-gray-500 mb-4">Organize as letras:</p>
                <h2 className="text-4xl font-black text-gray-800 mb-8 tracking-widest">{WORDS[level].s}</h2>
                <input 
                    className="w-full max-w-xs text-center p-3 rounded-xl border-2 border-gray-300 mb-4 text-xl uppercase font-bold" 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                />
                <button onClick={check} className="bg-black text-white px-8 py-3 rounded-xl font-bold">Verificar</button>
            </div>
        </div>
    );
};

// 8. FAKE CALL
const FakeCall = ({ onBack }: { onBack: () => void }) => {
    const [step, setStep] = useState('waiting'); // waiting, ringing, talking

    return (
        <div className="flex flex-col h-full bg-black text-white items-center justify-center relative overflow-hidden">
            <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-gray-800 rounded-full z-10"><X className="w-5 h-5" /></button>
            
            {step === 'waiting' && (
                <button onClick={() => setStep('ringing')} className="bg-green-600 px-8 py-3 rounded-xl font-bold">Agendar Chamada do Oppa</button>
            )}

            {step === 'ringing' && (
                <div className="flex flex-col items-center animate-pulse">
                    <div className="w-24 h-24 bg-gray-700 rounded-full mb-4 flex items-center justify-center text-4xl">🤴</div>
                    <h2 className="text-3xl font-bold">Meu Amor ❤️</h2>
                    <p className="text-gray-400 mb-12">Chamando...</p>
                    <div className="flex gap-16">
                        <button onClick={onBack} className="bg-red-500 p-4 rounded-full"><X className="w-8 h-8" /></button>
                        <button onClick={() => setStep('talking')} className="bg-green-500 p-4 rounded-full animate-bounce"><MessageCircle className="w-8 h-8" /></button>
                    </div>
                </div>
            )}

            {step === 'talking' && (
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">00:01</h2>
                    <p className="text-xl">"Bogo sip-eo..." (Sinto sua falta)</p>
                    <button onClick={onBack} className="bg-red-500 p-4 rounded-full mt-12"><X className="w-8 h-8" /></button>
                </div>
            )}
        </div>
    );
};

// 9. LOVE CALCULATOR
const LoveCalc = ({ onBack }: { onBack: () => void }) => {
    const [name1, setName1] = useState('');
    const [name2, setName2] = useState('');
    const [result, setResult] = useState<number | null>(null);

    const calc = () => {
        if (!name1 || !name2) return;
        setResult(Math.floor(Math.random() * 101));
    };

    return (
        <div className="flex flex-col h-full bg-red-50 p-6 items-center justify-center">
            <Header title="Calculadora" onBack={onBack} />
            <div className="flex-1 w-full max-w-xs flex flex-col justify-center space-y-4">
                <input placeholder="Seu Nome" className="p-3 rounded-xl border" value={name1} onChange={e => setName1(e.target.value)} />
                <div className="text-center text-red-500 font-bold">+</div>
                <input placeholder="Nome do Oppa" className="p-3 rounded-xl border" value={name2} onChange={e => setName2(e.target.value)} />
                <button onClick={calc} className="bg-red-500 text-white py-3 rounded-xl font-bold">Calcular</button>
                {result !== null && (
                    <div className="text-center mt-6">
                        <p className="text-5xl font-black text-red-600">{result}%</p>
                        <p className="text-sm text-gray-500">{result > 80 ? 'CASAMENTO À VISTA!' : 'Só amizade...'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// 10. DICTIONARY
const DictionaryGame = ({ onBack }: { onBack: () => void }) => {
    const WORDS = [
        {k: "Oppa", p: "Irmão mais velho/Namorado (usado por mulheres)"},
        {k: "Unnie", p: "Irmã mais velha (usado por mulheres)"},
        {k: "Saranghae", p: "Eu te amo"},
        {k: "Daebak", p: "Incrível / Grande sucesso"},
        {k: "Omo", p: "Ai meu Deus!"},
        {k: "Aigoo", p: "Expressão de surpresa/frustração"},
    ];
    return (
        <div className="flex flex-col h-full bg-blue-50">
            <Header title="Mini Dicionário" onBack={onBack} />
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {WORDS.map((w, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                        <h3 className="font-bold text-blue-800 text-lg">{w.k}</h3>
                        <p className="text-gray-600">{w.p}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 11. BINGO
const BingoGame = ({ onBack }: { onBack: () => void }) => {
    const [items, setItems] = useState<{t:string, c:boolean}[]>([
        {t: "Beijo acidental", c:false}, {t: "Sogra malvada", c:false}, {t: "Amigo na friendzone", c:false},
        {t: "Cena no hospital", c:false}, {t: "Puxão de braço", c:false}, {t: "Comendo lámen", c:false},
        {t: "Carregada nas costas", c:false}, {t: "Órfão rico", c:false}, {t: "Viagem no tempo", c:false}
    ]);

    const toggle = (idx: number) => {
        const n = [...items];
        n[idx].c = !n[idx].c;
        setItems(n);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <Header title="Bingo do Clichê" onBack={onBack} />
            <p className="text-center p-4 text-sm text-gray-500">Marque o que já aconteceu no dorama que está vendo:</p>
            <div className="grid grid-cols-3 gap-2 p-4">
                {items.map((it, i) => (
                    <button 
                        key={i} 
                        onClick={() => toggle(i)}
                        className={`aspect-square p-2 text-xs font-bold rounded-lg flex items-center justify-center text-center transition-colors ${it.c ? 'bg-green-500 text-white' : 'bg-white border-2 border-gray-200 text-gray-600'}`}
                    >
                        {it.t}
                    </button>
                ))}
            </div>
        </div>
    );
};

// 12. REFLEX GAME
const ReflexGame = ({ onBack }: { onBack: () => void }) => {
    const [state, setState] = useState('wait'); // wait, ready, now, done
    const [ms, setMs] = useState(0);
    const timerRef = useRef<number>(0);
    const startRef = useRef<number>(0);

    const start = () => {
        setState('ready');
        setTimeout(() => {
            setState('now');
            startRef.current = Date.now();
        }, 1000 + Math.random() * 2000);
    };

    const click = () => {
        if (state === 'now') {
            const diff = Date.now() - startRef.current;
            setMs(diff);
            setState('done');
        } else if (state === 'ready') {
            alert("Muito cedo!");
            setState('wait');
        }
    };

    return (
        <div 
            className={`flex flex-col h-full items-center justify-center p-6 transition-colors cursor-pointer select-none ${state === 'now' ? 'bg-green-500' : (state === 'done' ? 'bg-blue-500' : 'bg-gray-800 text-white')}`}
            onPointerDown={click}
        >
            {state !== 'now' && state !== 'done' && <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-gray-700 rounded-full z-10"><X className="w-5 h-5 text-white" /></button>}
            
            {state === 'wait' && <button onClick={(e) => {e.stopPropagation(); start();}} className="bg-white text-black px-8 py-4 rounded-xl font-bold">Iniciar Teste</button>}
            {state === 'ready' && <h2 className="text-3xl font-bold text-white">Aguarde o VERDE...</h2>}
            {state === 'now' && <h2 className="text-5xl font-black text-white">TOQUE AGORA!</h2>}
            {state === 'done' && (
                <div className="text-center text-white">
                    <h2 className="text-4xl font-bold mb-2">{ms} ms</h2>
                    <p>{ms < 250 ? 'Reflexo de Ninja!' : 'Oppa escapou...'}</p>
                    <button onClick={(e) => {e.stopPropagation(); setState('wait');}} className="mt-8 bg-white text-blue-600 px-6 py-2 rounded-lg font-bold">Tentar de Novo</button>
                    <button onClick={(e) => {e.stopPropagation(); onBack();}} className="mt-4 block mx-auto underline">Sair</button>
                </div>
            )}
        </div>
    );
};

// 13. THIS OR THAT
const ThisOrThat = ({ onBack }: { onBack: () => void }) => {
    const PAIRS = [
        ['Romance Escolar', 'Romance de Escritório'],
        ['Ator Mais Velho', 'Ator Mais Novo'],
        ['Final Feliz', 'Final Realista (Triste)'],
        ['Assistir Legendado', 'Assistir Dublado'],
        ['Maratona de Fim de Semana', '1 Ep por dia'],
        ['Vilão Carismático', 'Mocinho Perfeito']
    ];
    const [index, setIndex] = useState(0);

    const choose = () => {
        if (index < PAIRS.length - 1) setIndex(i => i + 1);
        else { alert("Fim das escolhas!"); onBack(); }
    };

    return (
        <div className="flex flex-col h-full bg-cyan-50">
            <Header title="Isso ou Aquilo?" onBack={onBack} />
            <div className="flex-1 flex flex-col justify-center gap-4 p-6">
                <button onClick={choose} className="flex-1 bg-white rounded-3xl shadow-lg flex items-center justify-center text-2xl font-bold text-cyan-800 hover:bg-cyan-100 transition-colors border-2 border-cyan-200">
                    {PAIRS[index][0]}
                </button>
                <div className="text-center font-bold text-gray-400">OU</div>
                <button onClick={choose} className="flex-1 bg-white rounded-3xl shadow-lg flex items-center justify-center text-2xl font-bold text-cyan-800 hover:bg-cyan-100 transition-colors border-2 border-cyan-200">
                    {PAIRS[index][1]}
                </button>
            </div>
        </div>
    );
};

const MemoryGame = ({ onBack }: { onBack: () => void }) => {
    const initialCards = ['❤️', '🍜', '💍', '👑', '🐶', '☂️'];
    const [cards, setCards] = useState(() => [...initialCards, ...initialCards].sort(() => Math.random() - 0.5).map((e, i) => ({ id: i, emoji: e, flipped: false, matched: false })));
    const [choiceOne, setChoiceOne] = useState<any>(null);
    const [choiceTwo, setChoiceTwo] = useState<any>(null);
    const [disabled, setDisabled] = useState(false);

    const handleChoice = (card: any) => {
        if (!disabled) {
            choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
            setCards(prev => prev.map(c => c.id === card.id ? { ...c, flipped: true } : c));
        }
    };

    useEffect(() => {
        if (choiceOne && choiceTwo) {
            setDisabled(true);
            if (choiceOne.emoji === choiceTwo.emoji) {
                setCards(prev => prev.map(c => c.emoji === choiceOne.emoji ? { ...c, matched: true } : c));
                resetTurn();
            } else {
                setTimeout(() => {
                    setCards(prev => prev.map(c => c.id === choiceOne.id || c.id === choiceTwo.id ? { ...c, flipped: false } : c));
                    resetTurn();
                }, 1000);
            }
        }
    }, [choiceOne, choiceTwo]);

    const resetTurn = () => {
        setChoiceOne(null);
        setChoiceTwo(null);
        setDisabled(false);
    };

    const isWin = cards.every(c => c.matched);

    return (
        <div className="flex flex-col h-full bg-green-50 p-6">
            <div className="flex justify-between items-center mb-4">
                <button onClick={onBack} className="p-2 bg-white rounded-full"><X className="w-6 h-6" /></button>
                <span className="font-bold text-green-900">Memória</span>
            </div>
            {isWin ? (
                <div className="text-center flex-1 flex flex-col justify-center items-center animate-bounce-in">
                    <Trophy className="w-24 h-24 text-yellow-500 mb-4" />
                    <h2 className="text-3xl font-extrabold text-green-800">Você Venceu!</h2>
                    <button onClick={onBack} className="mt-8 bg-green-600 text-white py-3 px-8 rounded-xl font-bold">Voltar</button>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3 mt-10">
                    {cards.map(card => (
                        <div 
                            key={card.id} 
                            className={`aspect-square flex items-center justify-center text-3xl bg-white rounded-xl shadow-sm border-2 cursor-pointer transition-all transform ${card.flipped ? 'rotate-y-180 border-green-500 bg-green-50' : 'border-green-200'}`}
                            onClick={() => !card.flipped && !disabled && handleChoice(card)}
                        >
                            {card.flipped || card.matched ? card.emoji : '❓'}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const LuckyGame = ({ onBack }: { onBack: () => void }) => {
    const [quote, setQuote] = useState<string | null>(null);
    const quotes = [
        "Hoje você vai encontrar um novo dorama favorito!",
        "Seu Oppa dos sonhos existe... nos seus sonhos!",
        "Prepare a pipoca, hoje é dia de maratona!",
        "Não chore, é apenas um dorama (mentira, chore sim).",
        "Sorte no amor? Melhor sorte no Wi-Fi para não travar!",
        "Um episódio a mais não mata ninguém.",
    ];

    const spin = () => {
        setQuote(null);
        setTimeout(() => {
            const random = quotes[Math.floor(Math.random() * quotes.length)];
            setQuote(random);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-full bg-yellow-50 p-6 items-center justify-center text-center">
            <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-white rounded-full"><X className="w-6 h-6" /></button>
            <Sparkles className="w-20 h-20 text-yellow-500 mb-6 animate-pulse" />
            <h2 className="text-2xl font-bold text-yellow-800 mb-8">O que o destino reserva?</h2>
            
            {quote && (
                <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-yellow-200 mb-8 animate-fade-in-up">
                    <p className="text-lg font-bold text-gray-800">"{quote}"</p>
                </div>
            )}

            <button onClick={spin} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-10 rounded-full shadow-lg transition-transform active:scale-95 text-xl">
                {quote ? 'Tentar de Novo' : 'Tirar a Sorte'}
            </button>
        </div>
    );
};

const JokenpoGame = ({ onBack }: { onBack: () => void }) => {
    const [result, setResult] = useState<string | null>(null);
    const [computerChoice, setComputerChoice] = useState<string | null>(null);

    const play = (choice: string) => {
        const options = ['Pedra', 'Papel', 'Tesoura'];
        const computer = options[Math.floor(Math.random() * 3)];
        setComputerChoice(computer);

        if (choice === computer) setResult("Empate! 😐");
        else if (
            (choice === 'Pedra' && computer === 'Tesoura') ||
            (choice === 'Papel' && computer === 'Pedra') ||
            (choice === 'Tesoura' && computer === 'Papel')
        ) {
            setResult("Você Venceu! 🎉");
        } else {
            setResult("Você Perdeu! 😭");
        }
    };

    return (
        <div className="flex flex-col h-full bg-orange-50 p-6 items-center justify-center">
            <button onClick={onBack} className="absolute top-6 left-6 p-2 bg-white rounded-full"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold text-orange-900 mb-8">Gawi Bawi Bo!</h2>
            
            {result && (
                <div className="text-center mb-10 animate-fade-in">
                    <p className="text-sm text-gray-500 uppercase font-bold">Computador escolheu</p>
                    <p className="text-3xl font-black text-orange-600 mb-2">{computerChoice}</p>
                    <div className="bg-white px-6 py-3 rounded-xl shadow-sm inline-block">
                        <span className="text-xl font-bold">{result}</span>
                    </div>
                </div>
            )}

            <div className="flex gap-4">
                <button onClick={() => play('Pedra')} className="w-24 h-24 bg-white rounded-2xl shadow-md border-b-4 border-orange-200 flex flex-col items-center justify-center active:scale-95 transition-transform">
                    <span className="text-3xl">✊</span>
                    <span className="text-xs font-bold mt-1 text-gray-600">Pedra</span>
                </button>
                <button onClick={() => play('Papel')} className="w-24 h-24 bg-white rounded-2xl shadow-md border-b-4 border-orange-200 flex flex-col items-center justify-center active:scale-95 transition-transform">
                    <span className="text-3xl">✋</span>
                    <span className="text-xs font-bold mt-1 text-gray-600">Papel</span>
                </button>
                <button onClick={() => play('Tesoura')} className="w-24 h-24 bg-white rounded-2xl shadow-md border-b-4 border-orange-200 flex flex-col items-center justify-center active:scale-95 transition-transform">
                    <span className="text-3xl">✌️</span>
                    <span className="text-xs font-bold mt-1 text-gray-600">Tesoura</span>
                </button>
            </div>
        </div>
    );
};

export default GamesHub;

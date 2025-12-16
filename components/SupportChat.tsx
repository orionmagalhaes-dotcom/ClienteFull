
import React, { useState, useEffect, useRef } from 'react';
import { Message, User } from '../types';
import { fetchStep, resolveCredentialAction } from '../services/supportService';
import { ChevronLeft, Copy, RefreshCw, ExternalLink, Check, Bot, MessageCircle, Sparkles, AlertTriangle, Fingerprint } from 'lucide-react';

interface SupportChatProps {
    user: User;
    initialStep?: string;
    onClose: () => void;
}

const SupportChat: React.FC<SupportChatProps> = ({ user, initialStep = 'root', onClose }) => {
    const [history, setHistory] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [currentStepId, setCurrentStepId] = useState(initialStep);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [copiedText, setCopiedText] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        loadStep(initialStep);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history, loading]);

    const loadStep = async (stepId: string) => {
        setLoading(true);
        // Simula um tempo de "pensar" para parecer mais natural
        await new Promise(resolve => setTimeout(resolve, 600)); 
        
        const stepData = await fetchStep(stepId);
        setLoading(false);

        if (!stepData) return;

        let formattedMessage = stepData.message;
        
        // Personaliza a mensagem se for o passo inicial
        if (stepId === 'root') {
            formattedMessage = `Olá, minha querida **${user.name}**! 👋 Tudo bem com você?\n\nSou a **Doraminha**, sua ajudante.\n\nEstou aqui para te explicar tudo com muita calma. Não precisa ter pressa, tá bom? 💖\n\nQual aplicativo você quer tentar conectar agora?`;
        }

        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'system',
            text: formattedMessage,
            timestamp: new Date(),
            options: stepData.options.map(opt => ({
                label: opt.label,
                action: () => handleOptionClick(opt)
            }))
        };

        setHistory(prev => [...prev, newMessage]);
        setCurrentStepId(stepId);
    };

    const handleOptionClick = async (option: any) => {
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: option.label,
            timestamp: new Date()
        };
        setHistory(prev => [...prev, userMsg]);

        if (option.action === 'copy_credential') {
            setLoading(true);
            const result = await resolveCredentialAction(user, option.action_value);
            setLoading(false);

            if (result.email || result.password) {
                 const credMsg: Message = {
                    id: Date.now().toString() + 'cred',
                    role: 'system',
                    text: `Prontinho! Aqui estão os dados para você copiar e colar.\n\nFaça com calma para não errar, tá bem?\n\nEmail: ${result.email}\nSenha: ${result.password}`,
                    timestamp: new Date(),
                    options: [] 
                 };
                 setHistory(prev => [...prev, credMsg]);
            } else {
                 setHistory(prev => [...prev, { id: Date.now().toString(), role: 'system', text: result.text, timestamp: new Date() }]);
            }
        }

        if (option.action === 'link' || option.action === 'open_url') {
             if (option.action_value) {
                 const displayUrl = option.action_value; 
                 const linkMsg: Message = {
                    id: Date.now().toString() + 'link',
                    role: 'system',
                    text: `Para funcionar direitinho, você precisa copiar esse site abaixo e abrir na **GUIA ANÔNIMA** do seu navegador.\n\nSite: ${displayUrl}`,
                    timestamp: new Date(),
                    options: []
                 };
                 setHistory(prev => [...prev, linkMsg]);
             }
        }

        if (option.next_step_id) {
            setTimeout(() => loadStep(option.next_step_id), 800);
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedText(text);
        setTimeout(() => setCopiedText(null), 2000);
    };

    const resetChat = () => {
        setHistory([]);
        loadStep('root');
    };

    const renderFormattedText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                const content = part.slice(2, -2);
                return <span key={index} className="font-extrabold text-pink-600">{content}</span>;
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <div className="flex flex-col h-full font-sans">
            {/* HEADER */}
            <div className="bg-white px-6 py-4 border-b border-pink-100 flex justify-between items-center shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="bg-gradient-to-tr from-pink-400 to-pink-600 p-3 rounded-full shadow-lg shadow-pink-200">
                            <Sparkles className="w-7 h-7 text-white animate-pulse" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                        <h3 className="font-extrabold text-xl text-gray-800 tracking-tight">Doraminha</h3>
                        <p className="text-sm text-gray-500 font-medium flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                            Ajudante Virtual
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={resetChat} className="p-3 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-2xl transition-all" title="Começar do zero">
                        <RefreshCw className="w-6 h-6" />
                    </button>
                    <button onClick={onClose} className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                        <ChevronLeft className="w-7 h-7" />
                    </button>
                </div>
            </div>

            {/* ÁREA DE MENSAGENS COM GRADIENTE */}
            <div className="flex-1 overflow-y-auto p-5 space-y-8 bg-gradient-to-b from-pink-50 to-white">
                {history.map((msg, index) => {
                    const isCredential = msg.text.includes('Email:') && msg.text.includes('Senha:');
                    const isLink = msg.text.includes('Site:') || msg.text.includes('http');
                    const isLastMessage = index === history.length - 1;

                    return (
                        <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}>
                            {msg.role === 'system' && (
                                <div className="flex items-end gap-3 mb-1">
                                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center mb-1 shadow-sm border border-pink-200">
                                        <Bot className="w-5 h-5 text-pink-600" />
                                    </div>
                                    <span className="text-xs text-gray-400 font-bold ml-1">Doraminha</span>
                                </div>
                            )}

                            <div className={`relative max-w-[95%] md:max-w-[85%] p-5 rounded-3xl text-lg leading-loose shadow-sm whitespace-pre-wrap transition-all ${
                                msg.role === 'user' 
                                ? 'bg-pink-600 text-white rounded-tr-none font-medium shadow-pink-200 shadow-md' 
                                : 'bg-white text-gray-700 border border-pink-100 rounded-tl-none font-normal shadow-sm'
                            }`}>
                                {renderFormattedText(msg.text.replace(/Email: .*/, '').replace(/Senha: .*/, '').replace(/Site: .*/, ''))}
                                
                                {isCredential && (
                                    <div className="mt-4 flex flex-col gap-4">
                                        {msg.text.match(/Email: (.*)/) && (
                                            <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200">
                                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Email (Login):</p>
                                                <div className="flex justify-between items-center gap-3">
                                                    <span className="font-mono text-xl font-bold text-gray-900 break-all select-all">{msg.text.match(/Email: (.*)/)![1]}</span>
                                                    <button onClick={() => handleCopy(msg.text.match(/Email: (.*)/)![1])} className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm active:scale-95 transition-transform hover:border-pink-300">
                                                        {copiedText === msg.text.match(/Email: (.*)/)![1] ? <Check className="w-6 h-6 text-green-500"/> : <Copy className="w-6 h-6 text-pink-500"/>}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {msg.text.match(/Senha: (.*)/) && (
                                            <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200">
                                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Senha:</p>
                                                <div className="flex justify-between items-center gap-3">
                                                    <span className="font-mono text-xl font-bold text-gray-900 tracking-widest select-all">{msg.text.match(/Senha: (.*)/)![1]}</span>
                                                    <button onClick={() => handleCopy(msg.text.match(/Senha: (.*)/)![1])} className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm active:scale-95 transition-transform hover:border-pink-300">
                                                        {copiedText === msg.text.match(/Senha: (.*)/)![1] ? <Check className="w-6 h-6 text-green-500"/> : <Copy className="w-6 h-6 text-pink-500"/>}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isLink && msg.text.match(/Site: (.*)/) && (
                                    <div className="mt-4 space-y-3">
                                        <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex gap-3 items-start">
                                            <div className="bg-white p-2 rounded-full shadow-sm"><Fingerprint className="w-6 h-6 text-orange-500" /></div>
                                            <div><p className="font-bold text-orange-800 text-sm mb-1">Atenção Obrigatória:</p><p className="text-sm text-orange-700 leading-tight">Use a <strong>Guia Anônima</strong> do seu navegador para não dar erro de conta antiga.</p></div>
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl border-2 border-pink-100 shadow-sm">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Link do Site:</p>
                                            <div className="flex flex-col gap-3">
                                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 break-all text-sm font-mono text-gray-600">{msg.text.match(/Site: (.*)/)![1]}</div>
                                                <button onClick={() => handleCopy(msg.text.match(/Site: (.*)/)![1])} className="w-full bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-200 transition-transform active:scale-95">
                                                    {copiedText === msg.text.match(/Site: (.*)/)![1] ? <Check className="w-5 h-5"/> : <Copy className="w-5 h-5"/>} {copiedText === msg.text.match(/Site: (.*)/)![1] ? 'Copiado!' : 'Copiar Link'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {msg.role === 'system' && msg.options && isLastMessage && (
                                <div className="flex flex-col w-full gap-3 mt-4 px-2 md:px-12 animate-fade-in-up delay-100">
                                    {msg.options.map((opt, idx) => {
                                        const isSupport = opt.label.includes('Suporte') || opt.label.includes('ajuda') || opt.label.includes('WhatsApp');
                                        return (
                                            <button key={idx} onClick={opt.action} className={`w-full px-6 py-5 rounded-lg text-lg font-bold shadow-sm transition-all active:scale-95 text-left flex justify-between items-center group ${isSupport ? 'bg-green-100 border-2 border-green-200 text-green-800 hover:bg-green-200' : 'bg-white border-2 border-pink-100 text-pink-900 hover:bg-pink-50 hover:border-pink-200'}`}>
                                                <span className="flex items-center gap-3">{isSupport ? <MessageCircle className="w-6 h-6 text-green-600 fill-current opacity-20" /> : <div className="w-2 h-2 rounded-full bg-pink-300"></div>}{opt.label}</span>
                                                {isSupport ? <ExternalLink className="w-6 h-6 text-green-600" /> : <ChevronLeft className="w-6 h-6 rotate-180 text-pink-300 group-hover:text-pink-600 transition-colors" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
                {loading && (
                     <div className="flex items-center gap-3 ml-2 mt-4 animate-pulse">
                         <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center"><Bot className="w-5 h-5 text-pink-400" /></div>
                         <div className="bg-gray-100 px-5 py-4 rounded-3xl rounded-tl-none flex items-center gap-1.5 shadow-sm"><div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce"></div><div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce delay-100"></div><div className="w-2.5 h-2.5 bg-gray-400 rounded-full animate-bounce delay-200"></div></div>
                     </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>
        </div>
    );
};

export default SupportChat;

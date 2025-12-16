import React, { useState } from 'react';
import { User } from '../types';
import { updateClientName } from '../services/clientService';
import { Smile, Sparkles, Loader2 } from 'lucide-react';

interface NameModalProps {
    user: User;
    onNameSaved: (newName: string) => void;
}

const NameModal: React.FC<NameModalProps> = ({ user, onNameSaved }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        // A função updateClientName agora é resiliente e retorna true mesmo se o DB falhar (fallback local)
        await updateClientName(user.phoneNumber, name.trim());
        setLoading(false);

        // Sempre prossegue para a UI, garantindo que o usuário não fique preso
        onNameSaved(name.trim());
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-fade-in-up text-center border-4 border-pink-200">
                <div className="bg-pink-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <Smile className="w-10 h-10 text-pink-600" />
                </div>
                
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Bem-vinda!</h2>
                <p className="text-gray-600 mb-6">
                    Que alegria ter você aqui! <br/>
                    <strong>Como você gostaria de ser chamada?</strong>
                </p>

                <form onSubmit={handleSave} className="space-y-4">
                    <div className="relative">
                        <input 
                            type="text" 
                            className="w-full bg-gray-50 border-2 border-pink-100 rounded-xl p-4 text-center text-lg font-bold text-gray-900 focus:ring-4 focus:ring-pink-100 focus:border-pink-300 outline-none placeholder-gray-300"
                            placeholder="Seu nome ou apelido..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            maxLength={20}
                        />
                        <Sparkles className="w-5 h-5 text-yellow-400 absolute top-4 right-4 animate-pulse" />
                    </div>

                    <button 
                        type="submit" 
                        disabled={!name.trim() || loading}
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-pink-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center text-lg"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Começar a Usar! ✨'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NameModal;
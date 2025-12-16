
import React, { useState } from 'react';
import { verifyAdminLogin, updateAdminPassword } from '../services/clientService';
import { ShieldAlert, ArrowLeft, Loader2, Key } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: (remember: boolean) => void;
  onBack: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBack }) => {
  const [login, setLogin] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [keepConnected, setKeepConnected] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [masterKey, setMasterKey] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const isValid = await verifyAdminLogin(login, pass);
    setLoading(false);
    
    if (isValid) {
      onSuccess(keepConnected);
    } else {
      setError('Credenciais inválidas.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (masterKey !== '1202') {
          setError('Chave Mestra Incorreta.');
          return;
      }
      if (newPass.length < 4) {
          setError('Nova senha muito curta.');
          return;
      }
      
      setLoading(true);
      await updateAdminPassword(newPass);
      setLoading(false);
      alert('Senha alterada com sucesso! Use a nova senha para entrar.');
      setShowChangePass(false);
      setPass('');
      setError('');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <button onClick={onBack} className="text-gray-500 mb-4 hover:text-gray-800 flex items-center">
          <ArrowLeft className="w-5 h-5 mr-1" /> Voltar
        </button>
        
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">{showChangePass ? 'Trocar Senha Admin' : 'Acesso Administrativo'}</h2>
        
        {!showChangePass ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">Login</label>
                <input 
                  type="text" 
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-3 mt-1 focus:ring-2 focus:ring-red-500 outline-none"
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  placeholder="admin"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">Senha</label>
                <input 
                  type="password" 
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-3 mt-1 focus:ring-2 focus:ring-red-500 outline-none"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                />
              </div>

              <div className="flex items-center mt-2">
                <input 
                    type="checkbox" 
                    id="adminKeep"
                    checked={keepConnected}
                    onChange={e => setKeepConnected(e.target.checked)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="adminKeep" className="ml-2 text-sm text-gray-600 cursor-pointer font-medium">
                    Permanecer conectado
                </label>
              </div>
              
              {error && <p className="text-red-600 text-sm font-bold text-center">{error}</p>}
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar no Painel'}
              </button>

              <button 
                type="button" 
                onClick={() => setShowChangePass(true)}
                className="w-full text-xs text-gray-500 hover:text-red-600 mt-4 underline"
              >
                Esqueci / Trocar Senha
              </button>
            </form>
        ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-xs text-yellow-800 mb-2">
                  Para trocar a senha, você precisa da <strong>Chave Mestra</strong> do sistema.
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">Chave Mestra</label>
                <input 
                  type="password" 
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-3 mt-1 focus:ring-2 focus:ring-red-500 outline-none"
                  value={masterKey}
                  onChange={e => setMasterKey(e.target.value)}
                  placeholder="Código numérico..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">Nova Senha</label>
                <input 
                  type="text" 
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-3 mt-1 focus:ring-2 focus:ring-red-500 outline-none"
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                />
              </div>
              
              {error && <p className="text-red-600 text-sm font-bold text-center">{error}</p>}
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gray-800 text-white font-bold py-3 rounded-lg hover:bg-black transition flex justify-center items-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Troca'}
              </button>
              
              <button 
                type="button"
                onClick={() => { setShowChangePass(false); setError(''); setMasterKey(''); setNewPass(''); }}
                className="w-full text-gray-500 font-bold py-2 hover:text-gray-800"
              >
                Cancelar
              </button>
            </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;

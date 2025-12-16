
import React, { useState, useEffect } from 'react';
import { X, Check, Copy, ShieldCheck, Zap, ArrowRight, MessageCircle, CalendarClock, Receipt, HelpCircle, AlertCircle, Gift, Rocket, Star, Calendar } from 'lucide-react';
import { User } from '../types';

interface CheckoutModalProps {
  onClose: () => void;
  user: User;
  type?: 'renewal' | 'gift' | 'new_sub' | 'early_renewal';
  targetService?: string;
}

const PIX_KEY = "00020126330014br.gov.bcb.pix0111024461983255204000053039865802BR5925Orion Saimon Magalhaes Co6009Sao Paulo62290525REC69361CCAD78A4566579523630467EB"; 

// Simplified Catalog for Benefit Lookup
const SERVICE_INFO: Record<string, string[]> = {
    'Viki Pass': ['Doramas Exclusivos', 'Sem Anúncios', 'Alta Qualidade (HD)', 'Acesso Antecipado'],
    'Kocowa+': ['Shows de K-Pop Ao Vivo', 'Reality Shows Coreanos', 'Legendas Rápidas', '100% Coreano'],
    'IQIYI': ['C-Dramas e Animes', 'Qualidade 4K e Dolby', 'Catálogo Gigante', 'Sem Anúncios'],
    'WeTV': ['Séries Tencent Video', 'Mini Doramas', 'Dublagem PT-BR', 'Variedades'],
    'DramaBox': ['Doramas Curtos', 'Episódios de 1 min', 'Histórias Intensas', 'Ideal para Celular']
};

const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose, user, type = 'renewal', targetService }) => {
  const [copied, setCopied] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [formattedPrice, setFormattedPrice] = useState('0,00');
  const [isMonthly, setIsMonthly] = useState(true);
  const [renewalList, setRenewalList] = useState<string[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);

  // Helper to calculate expiry for a specific service
  const checkServiceUrgency = (serviceName: string) => {
      const cleanKey = serviceName.split('|')[0].trim();
      let details = user.subscriptionDetails ? user.subscriptionDetails[cleanKey] : null;
      
      let purchaseDate = details ? new Date(details.purchaseDate) : new Date(user.purchaseDate);
      if (isNaN(purchaseDate.getTime())) purchaseDate = new Date();
      
      let duration = details ? details.durationMonths : (user.durationMonths || 1);
      
      const expiryDate = new Date(purchaseDate);
      expiryDate.setMonth(purchaseDate.getMonth() + duration);
      
      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Urgent if <= 3 days remaining (or expired)
      return daysLeft <= 4;
  };

  useEffect(() => {
    const services = user.services || [];
    const duration = user.durationMonths || 1;
    setIsMonthly(duration === 1);

    if (type === 'new_sub') {
        let price = 14.90;
        if (targetService && targetService.toLowerCase().includes('viki')) {
            price = 19.90;
        }
        setTotalPrice(price);
        setFormattedPrice(price.toFixed(2).replace('.', ','));
        setRenewalList([targetService || 'Novo Serviço']);

    } else if (duration === 1 && (type === 'renewal' || type === 'early_renewal')) {
        // Renewal Logic
        
        if (targetService) {
            // Direct click on a specific service card - renew only that one
            let price = 14.90;
            if (targetService.toLowerCase().includes('viki')) price = 19.90;
            setTotalPrice(price);
            setFormattedPrice(price.toFixed(2).replace('.', ','));
            setRenewalList([targetService]);
            setIsUrgent(checkServiceUrgency(targetService));
        } else {
            // "Renovar Agora" global button clicked
            // ... (Logic for global button remains same) ...
            const urgentServices = services.filter(svc => checkServiceUrgency(svc));
            
            let servicesToRenew: string[] = [];
            
            if (urgentServices.length > 0) {
                servicesToRenew = urgentServices;
                setIsUrgent(true);
            } else {
                servicesToRenew = services;
                setIsUrgent(false);
            }

            let total = 0;
            servicesToRenew.forEach(service => {
                if (service.toLowerCase().includes('viki')) {
                    total += 19.90;
                } else {
                    total += 14.90;
                }
            });
            
            setRenewalList(servicesToRenew);
            setTotalPrice(total);
            setFormattedPrice(total.toFixed(2).replace('.', ','));
        }
    } else {
        setTotalPrice(0);
        setFormattedPrice('---');
    }
  }, [user, type, targetService]);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendProof = () => {
    let message = '';
    
    if (type === 'gift') {
        message = `Olá! Fiz um Pix de presente para a Caixinha de Natal! 🎄✨ Segue o comprovante:`;
    } else if (type === 'new_sub') {
        const serviceName = targetService || 'Nova Assinatura';
        message = `Olá! Quero assinar o **${serviceName}** adicionalmente. Fiz o Pix de R$ ${formattedPrice}. Segue o comprovante (Cliente: ${user.phoneNumber}):`;
    } else if (type === 'early_renewal') {
        const itemText = renewalList.join(', ');
        message = `Olá! Fiz um Pix para ADIANTAR a renovação do **${itemText}** por mais 30 dias. Segue comprovante (Cliente: ${user.phoneNumber}):`;
    } else {
        const itemText = renewalList.join(', ');
        const valueText = isMonthly ? `R$ ${formattedPrice}` : 'o valor combinado';
        message = `Olá! Fiz um Pix referente a renovação de **${itemText}** no valor de ${valueText}. Segue o comprovante para o número ${user.phoneNumber}:`;
    }
    
    const url = `https://wa.me/558894875029?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    onClose();
  };

  const handleSupport = () => {
    const message = `Olá! Sou do plano ${!isMonthly ? 'Trimestral/Anual' : 'Mensal'} e preciso saber o valor correto para renovar minhas contas: ${user.services.join(', ')}.`;
    const url = `https://wa.me/558894875029?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const getHeaderIcon = () => {
      if (type === 'gift') return <Gift className="w-6 h-6 text-red-600" />;
      if (type === 'new_sub') return <Rocket className="w-6 h-6 text-blue-600" />;
      if (type === 'early_renewal') return <Calendar className="w-6 h-6 text-blue-600" />;
      return <Receipt className="w-6 h-6 text-green-700" />;
  };

  const getHeaderBg = () => {
      if (type === 'gift') return 'bg-red-100';
      if (type === 'new_sub') return 'bg-blue-100';
      if (type === 'early_renewal') return 'bg-blue-100';
      return 'bg-green-100';
  };

  const getTitle = () => {
      if (type === 'gift') return 'Caixinha de Natal';
      if (type === 'new_sub') return `Assinar ${targetService || 'Serviço'}`;
      if (type === 'early_renewal') return 'Adiantar Renovação';
      if (type === 'renewal' && targetService) return `Renovar ${targetService}`;
      return 'Pagamento / Renovação';
  };

  // Get benefits for new sub or single renewal
  let benefits: string[] = [];
  if ((type === 'new_sub' || ((type === 'renewal' || type === 'early_renewal') && renewalList.length === 1))) {
      const svcName = renewalList[0] || targetService || '';
      const key = Object.keys(SERVICE_INFO).find(k => svcName.includes(k));
      if (key) benefits = SERVICE_INFO[key];
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className={`p-5 border-b border-gray-100 flex justify-between items-center shrink-0 ${type === 'gift' ? 'bg-red-50' : 'bg-gray-50'}`}>
           <div className="flex items-center gap-3">
             <div className={`p-2.5 rounded-xl shadow-sm ${getHeaderBg()}`}>
                {getHeaderIcon()}
             </div>
             <div>
               <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">
                   {getTitle()}
               </h2>
               <p className="text-xs text-gray-500 font-medium">
                   {type === 'gift' ? 'Contribua com o projeto' : (type === 'new_sub' ? 'Adicione ao seu plano' : (type === 'early_renewal' ? 'Garanta mais 30 dias' : 'Pix para renovação'))}
               </p>
             </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
             <X className="w-6 h-6 text-gray-500" />
           </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          
            {/* EARLY RENEWAL EXPLANATION */}
            {type === 'early_renewal' && (
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                    <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                        <h4 className="font-bold text-blue-900 text-sm">Fique Tranquila!</h4>
                        <p className="text-sm text-blue-700 leading-relaxed mt-1">
                            Ao adiantar o pagamento, <strong>você não perde nenhum dia</strong> que ainda tem sobrando.
                            <br/>
                            Nós apenas acrescentamos <strong>+30 dias</strong> à sua data atual de vencimento.
                        </p>
                    </div>
                </div>
            )}

            {/* SINGLE ITEM SUMMARY (New Sub OR Single Renewal) */}
            {(type === 'new_sub' || ((type === 'renewal' || type === 'early_renewal') && renewalList.length === 1)) && (
                <div className="space-y-4">
                    {/* Benefits Card */}
                    {benefits.length > 0 && type !== 'early_renewal' && (
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                            <p className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center">
                                <Star className="w-3 h-3 mr-1" /> Vantagens Inclusas
                            </p>
                            <ul className="space-y-2">
                                {benefits.map((b, i) => (
                                    <li key={i} className="flex items-center text-sm text-blue-700">
                                        <Check className="w-4 h-4 mr-2 flex-shrink-0" /> {b}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center">
                        <div>
                            <span className="font-bold text-gray-900 text-lg block">{renewalList[0] || targetService}</span>
                            <span className="text-xs text-gray-500">Pagamento único (Mensal)</span>
                        </div>
                        <span className="font-extrabold text-3xl text-blue-600">R$ {formattedPrice}</span>
                    </div>
                </div>
            )}

            {/* BUNDLE RENEWAL SUMMARY */}
            {(type === 'renewal' || type === 'early_renewal') && renewalList.length > 1 && (
                <div className="space-y-4">
                    {isUrgent && type === 'renewal' && (
                        <div className="bg-red-50 p-3 rounded-xl text-center border border-red-100">
                            <p className="text-xs text-red-700 font-bold">
                                Atenção: Calculamos o valor apenas das assinaturas que venceram ou vencem em breve.
                            </p>
                        </div>
                    )}

                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center">
                            <CalendarClock className="w-3 h-3 mr-1" /> Itens a Renovar
                        </p>
                        
                        {isMonthly ? (
                            <>
                                <ul className="space-y-3 mb-4">
                                    {renewalList.map((service, idx) => {
                                        const isViki = service.toLowerCase().includes('viki');
                                        const price = isViki ? 'R$ 19,90' : 'R$ 14,90';
                                        return (
                                            <li key={idx} className="flex justify-between items-center text-sm border-b border-dashed border-gray-100 pb-2 last:border-0">
                                                <span className="font-medium text-gray-700 flex items-center">
                                                    <Check className="w-4 h-4 text-green-500 mr-2" /> {service}
                                                </span>
                                                <span className="font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded">{price}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <div className="flex justify-between items-center pt-3 border-t-2 border-gray-100">
                                    <span className="font-bold text-gray-600">Total</span>
                                    <span className="font-extrabold text-3xl text-green-600">R$ {formattedPrice}</span>
                                </div>
                            </>
                        ) : (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center space-y-3">
                                <div className="flex justify-center">
                                    <AlertCircle className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-blue-900 font-bold text-sm uppercase">Plano de Longa Duração</h3>
                                    <p className="text-blue-700 text-xs mt-1 leading-relaxed">
                                        Seu plano é Trimestral ou Anual ({user.durationMonths} meses).<br/>
                                        Por favor, confirme o valor atualizado com o suporte antes de realizar o pagamento.
                                    </p>
                                </div>
                                <button 
                                    onClick={handleSupport}
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
                                >
                                    Consultar Valor no Suporte
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Gift Message */}
            {type === 'gift' && (
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center">
                    <Gift className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-red-900 font-bold text-lg mb-2">Feliz Natal!</p>
                    <p className="text-red-700 text-sm">
                        Qualquer valor é bem-vindo para ajudar a manter o EuDorama ativo e trazendo novidades.
                        Obrigada pelo carinho! ❤️
                    </p>
                </div>
            )}

            {/* Payment Area */}
            <div className="space-y-6 text-center">
               <div className="flex items-center justify-center gap-2 mb-2">
                   <ShieldCheck className="w-4 h-4 text-green-600" />
                   <span className="text-green-700 text-xs font-bold bg-green-50 px-3 py-1 rounded-full">Chave Oficial</span>
               </div>

               <div className="bg-gray-100 p-5 rounded-2xl border border-gray-200 text-left relative group transition-colors hover:bg-gray-50 hover:border-gray-300">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Pix Copia e Cola</p>
                  <p className="text-xs text-gray-800 font-mono break-all line-clamp-3 leading-relaxed opacity-80">
                    {PIX_KEY}
                  </p>
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer" onClick={handleCopyPix}>
                     <span className="font-bold text-gray-900 bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                        <Copy className="w-4 h-4" /> Copiar Código
                     </span>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-3">
                   <button 
                      onClick={handleCopyPix}
                      className={`w-full py-4 rounded-xl font-bold flex justify-center items-center transition-all shadow-md active:scale-95 ${copied ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-black'}`}
                   >
                      {copied ? (
                        <><Check className="w-5 h-5 mr-2" /> Pix Copiado!</>
                      ) : (
                        <><Copy className="w-5 h-5 mr-2" /> Copiar Chave Pix</>
                      )}
                   </button>
               </div>
               
               {/* Separator */}
               <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-300 text-xs font-bold uppercase">Próximos Passos</span>
                    <div className="flex-grow border-t border-gray-200"></div>
               </div>

               <div className="space-y-3">
                  <button 
                    onClick={handleSendProof}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 transition-all flex justify-center items-center"
                  >
                     <MessageCircle className="w-5 h-5 mr-2" /> Enviar Comprovante
                  </button>
                  
                  {(type === 'renewal' || type === 'early_renewal') && (
                      <button 
                          onClick={handleSupport}
                          className="w-full text-xs text-gray-500 hover:text-primary-600 font-bold py-2 flex items-center justify-center gap-1 transition-colors"
                      >
                          <HelpCircle className="w-4 h-4" /> Dúvidas? Fale com o Suporte
                      </button>
                  )}
               </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;

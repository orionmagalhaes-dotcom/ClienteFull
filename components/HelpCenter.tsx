import React from 'react';
import { LOGIN_HELP_TIPS } from '../constants';
import { HelpCircle, ChevronRight, ExternalLink } from 'lucide-react';

const HelpCenter: React.FC = () => {
  return (
    <div className="space-y-6 pb-20">
      <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mx-2">
        <h2 className="text-xl font-bold text-indigo-900 mb-2 flex items-center">
          <HelpCircle className="w-6 h-6 mr-2" />
          Central de Ajuda de Login
        </h2>
        <p className="text-indigo-700 text-sm">
          Está com dificuldades para entrar nos seus apps de dorama? Siga o passo a passo abaixo.
        </p>
      </div>

      <div className="px-2 space-y-4">
        {LOGIN_HELP_TIPS.map((tip, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">{tip.app}</h3>
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </div>
            <div className="p-4">
              <ul className="space-y-3">
                {tip.steps.map((step, sIdx) => (
                  <li key={sIdx} className="flex items-start text-sm text-gray-600">
                    <ChevronRight className="w-4 h-4 text-primary-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center p-4">
        <p className="text-sm text-gray-500">Ainda com dúvidas? Fale com a <strong>Doraminha</strong> na aba Assistente!</p>
      </div>
    </div>
  );
};

export default HelpCenter;
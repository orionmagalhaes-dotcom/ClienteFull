
import { SupportFlowStep, User } from '../types';
import { getAssignedCredential } from './credentialService';

// --- MOCK DATA (FLUXO INTELIGENTE ATUALIZADO & AMIGÁVEL) ---
const MOCK_FLOWS: Record<string, SupportFlowStep> = {
    // =========================================================================
    // 1. RAIZ - ESCOLHA DO APP
    // =========================================================================
    'root': {
        id: 'root',
        message: 'Olá, minha querida! ❤️\n\nSou a **Doraminha**, sua ajudante virtual.\n\nEstou aqui para te explicar tudo com muita calma e carinho. Não precisa ter pressa, viu?\n\nQual aplicativo você quer assistir agora?',
        options: [
            { label: 'Viki Pass', next_step_id: 'viki_device_select' },
            { label: 'Kocowa+', next_step_id: 'kocowa_start' },
            { label: 'IQIYI', next_step_id: 'iqiyi_start' },
            { label: 'WeTV', next_step_id: 'wetv_start' },
            { label: 'DramaBox', next_step_id: 'dramabox_start' }
        ]
    },
    'viki_device_select': { id: 'viki_device_select', message: 'Ótima escolha! Onde quer assistir?', options: [{ label: 'Na TV', next_step_id: 'viki_tv_model_select' }, { label: 'No Celular', next_step_id: 'viki_mobile_install_check' }] },
    'viki_tv_model_select': { id: 'viki_tv_model_select', message: 'Qual a marca da TV?', options: [{ label: 'Samsung/LG', next_step_id: 'viki_tv_sl_screen_check' }, { label: 'TCL/Roku', next_step_id: 'viki_tv_tcl_check' }] },
    'viki_tv_sl_screen_check': { id: 'viki_tv_sl_screen_check', message: 'O que aparece na tela?', options: [{ label: 'Código', next_step_id: 'viki_tv_sl_code_guide' }, { label: 'Botão Entrar', next_step_id: 'viki_tv_sl_click_login' }] },
    'viki_tv_sl_code_guide': { id: 'viki_tv_sl_code_guide', message: 'Deixe o código na TV. Pegue o celular.', options: [{ label: 'Samsung', next_step_id: 'viki_tv_samsung_link_action' }, { label: 'LG', next_step_id: 'viki_tv_lg_link_action' }] },
    'viki_tv_samsung_link_action': { id: 'viki_tv_samsung_link_action', message: 'Abra este site em guia anônima:', options: [{ label: 'Link Samsung', action: 'link', action_value: 'https://www.viki.com/samsungtv', next_step_id: 'viki_tv_sl_site_check' }] },
    'viki_tv_lg_link_action': { id: 'viki_tv_lg_link_action', message: 'Abra este site em guia anônima:', options: [{ label: 'Link LG', action: 'link', action_value: 'https://www.viki.com/lgtv', next_step_id: 'viki_tv_sl_site_check' }] },
    'viki_tv_sl_site_check': { id: 'viki_tv_sl_site_check', message: 'Achou o botão de Login?', options: [{ label: 'Sim', next_step_id: 'viki_tv_sl_login_process' }] },
    'viki_tv_sl_login_process': { id: 'viki_tv_sl_login_process', message: 'Copie os dados para entrar no site:', options: [{ label: 'Copiar Dados', action: 'copy_credential', action_value: 'viki', next_step_id: 'viki_tv_sl_input_code' }] },
    'viki_tv_sl_input_code': { id: 'viki_tv_sl_input_code', message: 'Agora digite o código da TV no celular.', options: [{ label: 'Feito', next_step_id: 'root' }] },
    'viki_mobile_install_check': { id: 'viki_mobile_install_check', message: 'Tem o app instalado?', options: [{ label: 'Sim', next_step_id: 'viki_mobile_screen_check' }] },
    'viki_mobile_screen_check': { id: 'viki_mobile_screen_check', message: 'Vê banners ou tela de login?', options: [{ label: 'Login', next_step_id: 'viki_mobile_login_grey' }] },
    'viki_mobile_login_grey': { id: 'viki_mobile_login_grey', message: 'Clique em Entrar com Email.', options: [{ label: 'Ok', next_step_id: 'viki_mobile_creds' }] },
    'viki_mobile_creds': { id: 'viki_mobile_creds', message: 'Use estes dados:', options: [{ label: 'Copiar', action: 'copy_credential', action_value: 'viki', next_step_id: 'root' }] },
    'kocowa_start': { id: 'kocowa_start', message: 'Kocowa! Onde vai ver?', options: [{ label: 'Celular', next_step_id: 'kocowa_mobile_check' }] },
    'kocowa_mobile_check': { id: 'kocowa_mobile_check', message: 'Já tem o app?', options: [{ label: 'Sim', next_step_id: 'kocowa_mobile_login' }] },
    'kocowa_mobile_login': { id: 'kocowa_mobile_login', message: 'Entre com estes dados:', options: [{ label: 'Copiar', action: 'copy_credential', action_value: 'kocowa', next_step_id: 'root' }] },
    'iqiyi_start': { id: 'iqiyi_start', message: 'IQIYI começa no celular!', options: [{ label: 'Tenho App', next_step_id: 'iqiyi_check_status' }] },
    'iqiyi_check_status': { id: 'iqiyi_check_status', message: 'Vá em Eu. O que vê?', options: [{ label: 'Login', next_step_id: 'iqiyi_login_manual_entry' }] },
    'iqiyi_login_manual_entry': { id: 'iqiyi_login_manual_entry', message: 'Entre com email:', options: [{ label: 'Copiar', action: 'copy_credential', action_value: 'iqiyi', next_step_id: 'root' }] },
    'wetv_start': { id: 'wetv_start', message: 'WeTV: Onde?', options: [{ label: 'Celular', next_step_id: 'wetv_mobile_nav' }] },
    'wetv_mobile_nav': { id: 'wetv_mobile_nav', message: 'Vá em Conta > Entrar > Email.', options: [{ label: 'Achei', next_step_id: 'wetv_mobile_email_input' }] },
    'wetv_mobile_email_input': { id: 'wetv_mobile_email_input', message: 'Copie os dados:', options: [{ label: 'Copiar', action: 'copy_credential', action_value: 'wetv', next_step_id: 'root' }] },
    'dramabox_start': { id: 'dramabox_start', message: 'DramaBox é só Android.', options: [{ label: 'Tenho Android', next_step_id: 'root' }] }
};

export const fetchStep = async (stepId: string): Promise<SupportFlowStep | null> => {
    return MOCK_FLOWS[stepId] || MOCK_FLOWS['root'];
};

export const resolveCredentialAction = async (user: User, actionValue?: string): Promise<{ text: string, email?: string, password?: string }> => {
    if (!actionValue) return { text: "Erro: Serviço não especificado." };

    if (user.phoneNumber.startsWith('99999')) {
        const demoEmail = `demo_${actionValue.toLowerCase().replace(/\s+/g, '')}@eudorama.com`;
        const demoPass = 'demo1234';
        return {
            text: `[MODO DEMONSTRAÇÃO]\n\nLogin: ${demoEmail}\nSenha: ${demoPass}`,
            email: demoEmail,
            password: demoPass
        };
    }

    const serviceName = user.services.find(s => s.toLowerCase().includes(actionValue.toLowerCase()));
    
    if (!serviceName) {
        return { text: `Poxa meu bem, parece que você não tem o plano do **${actionValue}** ativo ou ele venceu. 😢` };
    }

    const { credential } = await getAssignedCredential(user, serviceName);

    if (!credential) {
        return { text: "Ainda estamos preparando seu acesso. Aguarde um pouquinho ou chame o suporte no WhatsApp. ⏳" };
    }

    return {
        text: `Login: ${credential.email}\nSenha: ${credential.password}`,
        email: credential.email,
        password: credential.password
    };
};

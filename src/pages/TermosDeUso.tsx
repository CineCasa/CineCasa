import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield, FileText } from 'lucide-react';

const sections = {
  termos: [
    {
      titulo: '1. Aceitação dos Termos',
      texto: `Ao criar uma conta ou acessar o CineCasa, você concorda com estes Termos de Uso. Se não concordar com alguma disposição, não utilize a plataforma. O CineCasa reserva-se o direito de modificar estes termos a qualquer momento, comunicando as alterações por e-mail ou notificação no aplicativo.`,
    },
    {
      titulo: '2. Descrição do Serviço',
      texto: `O CineCasa é uma plataforma de streaming de filmes e séries operada no Brasil. O acesso ao conteúdo é concedido mediante assinatura de plano, conforme as opções disponíveis na plataforma. O conteúdo disponibilizado é para uso pessoal e não comercial.`,
    },
    {
      titulo: '3. Conta de Usuário',
      texto: `Você é responsável por manter a confidencialidade de suas credenciais de acesso. É vedado o compartilhamento de conta com pessoas fora do seu núcleo familiar. O CineCasa pode suspender ou encerrar contas que violem esta política. Você deve ter no mínimo 18 anos para criar uma conta, ou ser representado por um responsável legal.`,
    },
    {
      titulo: '4. Propriedade Intelectual',
      texto: `Todo o conteúdo disponível na plataforma — filmes, séries, imagens, logotipos e materiais gráficos — é protegido por direitos autorais. É estritamente proibido copiar, reproduzir, distribuir ou criar obras derivadas sem autorização prévia e expressa do CineCasa ou dos titulares dos direitos.`,
    },
    {
      titulo: '5. Uso Proibido',
      texto: `É proibido: (a) burlar medidas de proteção técnica; (b) fazer download não autorizado de conteúdo; (c) usar bots, scripts ou ferramentas automatizadas; (d) acessar o serviço por meios não autorizados; (e) compartilhar credenciais de acesso publicamente; (f) utilizar VPN para contornar restrições regionais.`,
    },
    {
      titulo: '6. Cancelamento e Reembolso',
      texto: `Você pode cancelar sua assinatura a qualquer momento nas configurações da conta. O acesso continua ativo até o fim do período pago. Reembolsos são concedidos apenas nos primeiros 7 dias após a contratação inicial, em conformidade com o Código de Defesa do Consumidor (CDC), Art. 49.`,
    },
    {
      titulo: '7. Disponibilidade do Serviço',
      texto: `O CineCasa não garante disponibilidade ininterrupta do serviço. Manutenções programadas serão comunicadas com antecedência. Não nos responsabilizamos por interrupções causadas por fatores fora de nosso controle (problemas de rede, força maior, etc.).`,
    },
    {
      titulo: '8. Limitação de Responsabilidade',
      texto: `O CineCasa não se responsabiliza por danos indiretos, incidentais, especiais ou consequentes decorrentes do uso ou incapacidade de uso do serviço. Nossa responsabilidade máxima é limitada ao valor pago pelo plano no mês em que o dano ocorreu.`,
    },
    {
      titulo: '9. Legislação Aplicável',
      texto: `Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes deste instrumento, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`,
    },
  ],
  privacidade: [
    {
      titulo: '1. Dados que Coletamos',
      texto: `Coletamos: (a) Dados de cadastro: nome, e-mail, senha criptografada; (b) Dados de uso: histórico de visualização, buscas realizadas, avaliações; (c) Dados de dispositivo: tipo de dispositivo, sistema operacional, endereço IP; (d) Dados de pagamento: processados por gateway de terceiros — não armazenamos dados de cartão de crédito.`,
    },
    {
      titulo: '2. Como Usamos seus Dados',
      texto: `Utilizamos seus dados para: fornecer e personalizar o serviço; recomendar conteúdo com base no seu histórico; enviar comunicações sobre sua conta e novidades; detectar e prevenir fraudes; cumprir obrigações legais e regulatórias.`,
    },
    {
      titulo: '3. Base Legal (LGPD)',
      texto: `Processamos seus dados com base nas seguintes bases legais previstas na Lei 13.709/2018 (LGPD): execução de contrato (para prestação do serviço); legítimo interesse (para segurança e prevenção de fraudes); consentimento (para comunicações de marketing, que pode ser revogado a qualquer momento); cumprimento de obrigação legal.`,
    },
    {
      titulo: '4. Compartilhamento de Dados',
      texto: `Não vendemos seus dados pessoais. Podemos compartilhá-los com: parceiros de infraestrutura (Supabase/AWS, para hospedagem); provedores de pagamento; autoridades legais, quando exigido por lei. Todos os terceiros são obrigados contratualmente a proteger seus dados.`,
    },
    {
      titulo: '5. Seus Direitos (LGPD)',
      texto: `Você tem direito a: confirmar a existência de tratamento; acessar seus dados; corrigir dados incompletos ou imprecisos; solicitar anonimização, bloqueio ou eliminação de dados desnecessários; revogar consentimento; solicitar portabilidade dos dados; obter informações sobre compartilhamento. Exerça seus direitos pelo e-mail: privacidade@cinecasa.com.br`,
    },
    {
      titulo: '6. Segurança',
      texto: `Implementamos medidas técnicas e organizacionais para proteger seus dados: criptografia em trânsito (HTTPS/TLS) e em repouso; controles de acesso por função; monitoramento de acessos; política de senhas fortes. Em caso de incidente de segurança que afete seus dados, notificaremos conforme exigido pela LGPD.`,
    },
    {
      titulo: '7. Cookies e Tecnologias Similares',
      texto: `Utilizamos cookies essenciais (necessários para o funcionamento do serviço) e cookies de análise (com sua autorização). Você pode gerenciar suas preferências de cookies nas configurações do navegador. A desativação de cookies essenciais pode comprometer o funcionamento do serviço.`,
    },
    {
      titulo: '8. Retenção de Dados',
      texto: `Mantemos seus dados enquanto sua conta estiver ativa. Após o cancelamento, dados de uso são anonimizados em 30 dias. Dados necessários para obrigações legais (como dados fiscais) são mantidos pelo prazo legal aplicável. Você pode solicitar a exclusão antecipada de seus dados pelo e-mail de privacidade.`,
    },
    {
      titulo: '9. Contato e Encarregado de Dados',
      texto: `Encarregado de Proteção de Dados (DPO): dpo@cinecasa.com.br. Para exercício de direitos LGPD: privacidade@cinecasa.com.br. Endereço: Av. Paulista, 1000, São Paulo/SP, CEP 01310-100. Atendimento: segunda a sexta, 9h às 18h.`,
    },
  ],
};

export default function TermosDeUso() {
  const navigate = useNavigate();
  const [aba, setAba] = useState<'termos' | 'privacidade'>('termos');

  return (
    <div style={{ minHeight: '100vh', background: '#070A10', color: '#EAF6FF', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(7,10,16,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0 }}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Documentos Legais</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Última atualização: Janeiro de 2026</p>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px 80px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 4, marginBottom: 32 }}>
          {[
            { key: 'termos', label: 'Termos de Uso', icon: <FileText size={16} /> },
            { key: 'privacidade', label: 'Política de Privacidade', icon: <Shield size={16} /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setAba(tab.key as any)}
              style={{
                flex: 1, padding: '10px 16px', border: 'none', borderRadius: 10,
                fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
                background: aba === tab.key ? '#00B7FF' : 'transparent',
                color: aba === tab.key ? 'black' : 'rgba(255,255,255,0.55)',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Intro */}
        <div style={{ background: 'rgba(0,183,255,0.08)', border: '1px solid rgba(0,183,255,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 28, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Shield size={20} color="#00B7FF" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            {aba === 'termos'
              ? 'Ao utilizar o CineCasa, você concorda com os termos abaixo. Leia com atenção antes de usar a plataforma.'
              : 'Sua privacidade é importante para nós. Esta política descreve como coletamos, usamos e protegemos seus dados em conformidade com a LGPD (Lei 13.709/2018).'}
          </p>
        </div>

        {/* Seções */}
        {sections[aba].map((section, i) => (
          <div key={i} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#00B7FF', marginBottom: 10 }}>{section.titulo}</h2>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.72)', margin: 0 }}>{section.texto}</p>
          </div>
        ))}

        {/* Footer legal */}
        <div style={{ marginTop: 40, padding: '20px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, borderTop: '2px solid rgba(0,183,255,0.3)' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: 0 }}>
            © {new Date().getFullYear()} CineCasa. Todos os direitos reservados. CNPJ: XX.XXX.XXX/0001-XX.
            {' '}Este documento foi elaborado em conformidade com o Código de Defesa do Consumidor (Lei 8.078/1990)
            e a Lei Geral de Proteção de Dados Pessoais — LGPD (Lei 13.709/2018).
          </p>
        </div>
      </div>
    </div>
  );
}

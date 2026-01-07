import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import movellinhoMascote from "@/assets/movellinho-mascote.png";

interface ChatOption {
  label: string;
  next?: string;
  action?: "navigate" | "whatsapp";
  url?: string;
  phone?: string;
}

interface ChatFlow {
  message: string;
  options: ChatOption[];
}

const chatFlows: Record<string, ChatFlow> = {
  greeting: {
    message: "Olá! Sou o Movellinho, assistente virtual da Movello. Como posso te ajudar hoje?",
    options: [
      { label: "Quero anunciar minha empresa", next: "empresa" },
      { label: "Quero ser motorista parceiro", next: "motorista" },
      { label: "Quanto custa anunciar?", next: "preco" },
      { label: "Como funciona?", next: "funcionamento" },
      { label: "Falar com consultor", next: "whatsapp" }
    ]
  },
  empresa: {
    message: "Ótima escolha! Com a Movello você anuncia direto para passageiros de Uber/99 no raio que escolher. Quer criar sua conta agora ou prefere falar com um consultor?",
    options: [
      { label: "Criar minha conta", action: "navigate", url: "/cadastro-empresa" },
      { label: "Falar com consultor", next: "whatsapp" },
      { label: "Voltar ao início", next: "greeting" }
    ]
  },
  motorista: {
    message: "Legal! Motoristas parceiros ganham dinheiro extra exibindo anúncios. A instalação do tablet é gratuita e você começa a ganhar assim que os anúncios aparecem.",
    options: [
      { label: "Quero me cadastrar", action: "navigate", url: "/cadastro-motorista" },
      { label: "Saber mais", next: "motorista_info" },
      { label: "Voltar ao início", next: "greeting" }
    ]
  },
  motorista_info: {
    message: "Você receberá um tablet gratuitamente, instalado no encosto do banco. Cada anúncio exibido gera ganhos que são creditados semanalmente na sua conta.",
    options: [
      { label: "Quero me cadastrar", action: "navigate", url: "/cadastro-motorista" },
      { label: "Falar no WhatsApp", next: "whatsapp" },
      { label: "Voltar ao início", next: "greeting" }
    ]
  },
  preco: {
    message: "Os valores variam de acordo com a quantidade de impressões, raio de exibição e duração da campanha. Para uma proposta personalizada, fale com nosso time comercial!",
    options: [
      { label: "Falar no WhatsApp", next: "whatsapp" },
      { label: "Quero me cadastrar primeiro", action: "navigate", url: "/cadastro-empresa" },
      { label: "Voltar ao início", next: "greeting" }
    ]
  },
  funcionamento: {
    message: "Nossos tablets são instalados em carros de Uber/99. Quando o veículo entra no raio que você definiu, seu anúncio aparece automaticamente para o passageiro. 100% GPS, 100% rastreável!",
    options: [
      { label: "Qual o raio mínimo?", next: "raio" },
      { label: "Quero anunciar!", action: "navigate", url: "/cadastro-empresa" },
      { label: "Voltar ao início", next: "greeting" }
    ]
  },
  raio: {
    message: "Você pode configurar raios de 500 metros até 5 quilômetros. Perfeito para negócios locais que querem atrair clientes próximos!",
    options: [
      { label: "Começar agora", action: "navigate", url: "/cadastro-empresa" },
      { label: "Falar com consultor", next: "whatsapp" },
      { label: "Voltar ao início", next: "greeting" }
    ]
  },
  whatsapp: {
    message: "Vou te redirecionar para nosso WhatsApp. Nosso time comercial vai te atender rapidinho!",
    options: [
      { label: "Abrir WhatsApp", action: "whatsapp", phone: "5511999999999" },
      { label: "Voltar ao início", next: "greeting" }
    ]
  }
};

interface Message {
  id: number;
  type: "bot" | "user";
  text: string;
}

const MovellinhoChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentFlow, setCurrentFlow] = useState("greeting");
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: "bot", text: chatFlows.greeting.message }
  ]);
  const navigate = useNavigate();

  const handleOptionClick = (option: ChatOption) => {
    // Adiciona mensagem do usuário
    const newUserMessage: Message = {
      id: messages.length + 1,
      type: "user",
      text: option.label
    };
    
    if (option.action === "navigate" && option.url) {
      setMessages(prev => [...prev, newUserMessage]);
      setTimeout(() => {
        setIsOpen(false);
        navigate(option.url!);
      }, 500);
      return;
    }

    if (option.action === "whatsapp" && option.phone) {
      window.open(`https://wa.me/${option.phone}?text=Olá! Vim pelo site da Movello e gostaria de mais informações.`, "_blank");
      return;
    }

    if (option.next) {
      const nextFlow = chatFlows[option.next];
      if (nextFlow) {
        const newBotMessage: Message = {
          id: messages.length + 2,
          type: "bot",
          text: nextFlow.message
        };
        setMessages(prev => [...prev, newUserMessage, newBotMessage]);
        setCurrentFlow(option.next);
      }
    }
  };

  const resetChat = () => {
    setMessages([{ id: 1, type: "bot", text: chatFlows.greeting.message }]);
    setCurrentFlow("greeting");
  };

  const currentOptions = chatFlows[currentFlow]?.options || [];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-20 right-0 w-80 sm:w-96 bg-background rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary p-4 flex items-center gap-3">
              <img 
                src={movellinhoMascote} 
                alt="Movellinho" 
                className="w-10 h-10 object-contain"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-primary-foreground">Movellinho</h3>
                <p className="text-xs text-primary-foreground/80">Assistente Virtual</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-4 space-y-3 bg-muted/30">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                      message.type === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-background border border-border rounded-bl-md"
                    }`}
                  >
                    {message.text}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Replies */}
            <div className="p-4 border-t border-border space-y-2 max-h-48 overflow-y-auto">
              {currentOptions.map((option, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleOptionClick(option)}
                  className="w-full text-left px-4 py-2.5 text-sm bg-secondary hover:bg-secondary/80 rounded-xl transition-colors flex items-center justify-between group"
                >
                  <span>{option.label}</span>
                  {option.action && (
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 pb-3">
              <button
                onClick={resetChat}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Recomeçar conversa
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button with Bubble */}
      <div className="relative">
        {/* Speech Bubble */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              transition={{ delay: 1 }}
              className="absolute bottom-full right-0 mb-3 mr-2"
            >
              <motion.div
                animate={{ opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-background rounded-2xl rounded-br-md px-4 py-3 shadow-lg border border-border max-w-[200px]"
              >
                <p className="text-sm font-medium text-foreground">
                  Olá, como posso te ajudar hoje? 👋
                </p>
                {/* Triangle pointer */}
                <div className="absolute -bottom-2 right-4 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-background" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Movellinho */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          animate={{ y: isOpen ? 0 : [0, -8, 0] }}
          transition={{ duration: 3, repeat: isOpen ? 0 : Infinity, ease: "easeInOut" }}
          className="relative w-16 h-16 rounded-full bg-primary shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X className="w-6 h-6 text-primary-foreground" />
              </motion.div>
            ) : (
              <motion.img
                key="mascot"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                src={movellinhoMascote}
                alt="Movellinho - Clique para conversar"
                className="w-12 h-12 object-contain"
              />
            )}
          </AnimatePresence>
          
          {/* Online indicator */}
          <span className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
        </motion.button>
      </div>
    </div>
  );
};

export default MovellinhoChatbot;

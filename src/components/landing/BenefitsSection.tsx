import { motion } from "framer-motion";
import { Monitor, MapPin, QrCode, Smartphone, BarChart3, Settings } from "lucide-react";

const benefits = [
  {
    icon: Monitor,
    title: "Anúncio em todas as telas",
    description:
      "Tela dedicada para o seu conteúdo durante toda a viagem, ambiente relaxante, motorista como embaixador e foco em conversão.",
  },
  {
    icon: QrCode,
    title: "QR Code inteligente",
    description:
      "Ação em um toque: passageiro escaneia e cai direto no WhatsApp, site ou página da sua empresa, sem fricção.",
  },
  {
    icon: MapPin,
    title: "Geolocalização e segmentação",
    description:
      "Mostre anúncios na região desejada e para o público certo: pequenos negócios, campanhas locais e mensagens por nicho.",
  },
  {
    icon: Settings,
    title: "Gestão avançada de anúncios",
    description:
      "Defina horário, região, público-alvo e limite de saldo. Controle total de quando e onde sua marca aparece.",
  },
  {
    icon: BarChart3,
    title: "Métricas em tempo real",
    description:
      "Impressões, mapa de calor e escaneamentos atualizados. Visibilidade clara para ajustar campanhas rapidamente.",
  },
  {
    icon: Smartphone,
    title: "App Movello e escala",
    description:
      "Crie, edite e gerencie campanhas pelo app. Infraestrutura pronta para crescer com o volume da sua empresa.",
  },
];

const BenefitsSection = () => {
  return (
    <section id="beneficios" className="section-padding bg-muted/30 relative overflow-hidden">
      <div className="container-section relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            Benefícios e diferenciais
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground">
            O que sua empresa recebe ao <br />
            <span className="text-gradient-primary">anunciar com a Movello</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group card-premium p-8 hover:-translate-y-2 transition-all duration-300"
            >
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:shadow-glow-primary transition-all duration-300">
                <benefit.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>

              <h3 className="text-xl font-display font-bold text-foreground mb-3">
                {benefit.title}
              </h3>

              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;









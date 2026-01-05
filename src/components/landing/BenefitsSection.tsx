import { motion } from "framer-motion";
import { Monitor, MapPin, QrCode, Smartphone, BarChart3, Rocket } from "lucide-react";
import movellinhoMascote from "@/assets/movellinho-mascote.png";

const benefits = [
  {
    icon: Monitor,
    title: "Anúncios em tablets",
    description: "Visibilidade fullscreen diariamente nas rotas mais movimentadas.",
  },
  {
    icon: MapPin,
    title: "Mídia geolocalizada",
    description: "Apareça exatamente dentro do raio que você escolher.",
  },
  {
    icon: QrCode,
    title: "QR Code inteligente",
    description: "Transforme passageiros em clientes em segundos.",
  },
  {
    icon: Smartphone,
    title: "App Movello",
    description: "Crie, edite e gerencie campanhas onde estiver.",
  },
  {
    icon: BarChart3,
    title: "Painel de métricas",
    description: "Impressões, mapa de calor e escaneamentos em tempo real.",
  },
  {
    icon: Rocket,
    title: "Tecnologia escalável",
    description: "Plataforma pronta para crescer com sua empresa.",
  },
];

const BenefitsSection = () => {
  return (
    <section id="beneficios" className="section-padding bg-muted/30 relative overflow-hidden">
      {/* Movellinho decorativo */}
      <motion.img
        src={movellinhoMascote}
        alt=""
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 right-8 w-24 h-24 object-contain opacity-40 hidden lg:block pointer-events-none"
      />
      <div className="container-section relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            Benefícios
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground">
            O que sua empresa recebe ao
            <br />
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

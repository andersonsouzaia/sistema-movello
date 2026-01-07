import { motion } from "framer-motion";
import { Settings, MapPin, Megaphone, QrCode, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import heroImage from "@/assets/hero-tablet.png";
import tabletInteracao from "@/assets/tablet-interacao.png";

const steps = [
  {
    number: "01",
    icon: Settings,
    title: "Crie sua campanha",
    description: "Defina raio, horário, dias, regiões. Envie imagem/vídeo. Configure o QR Code. Controle total pelo painel ou App Movello.",
  },
  {
    number: "02",
    icon: MapPin,
    title: "Exibição automática e geolocalizada",
    description: "GPS identifica quando o carro entra no raio. O anúncio aparece imediatamente no tablet. 100% automático. Zero desperdício.",
  },
  {
    number: "03",
    icon: QrCode,
    title: "O passageiro interage e você vende",
    description: "QR Code destacado, scan na hora. Lead instantâneo no WhatsApp, site ou página. Mais conversas, mais vendas.",
  },
  {
    number: "04",
    icon: Megaphone,
    title: "Motoristas como Embaixadores de Marca",
    description: "Os motoristas parceiros da Movello tornam-se embaixadores das campanhas, levando a marca para milhares de pessoas todos os dias e gerando conexão real com o público.",
  },
];

const HowItWorksSection = () => {
  const isMobile = useIsMobile();

  return (
    <section id="como-funciona" className="section-padding bg-muted/30">
      <div className="container-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            Como funciona
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground">
            4 passos simples para atrair
            <br />
            <span className="text-gradient-primary">clientes todos os dias</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              {/* Connection Line - entre os cards */}
              {index < steps.length - 1 && (
                <div 
                  className="hidden lg:block absolute top-1/2 right-0 w-8 h-0.5 bg-gradient-to-r from-primary/30 to-primary/10 -translate-y-1/2 translate-x-full z-0"
                />
              )}

              <div className="card-premium p-8 h-full hover:-translate-y-2 transition-transform duration-300 relative z-10">
                {/* Step Number */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-5xl font-display font-bold text-primary/20">
                    {step.number}
                  </span>
                  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-glow-primary">
                    <step.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                </div>

                <h3 className="text-xl font-display font-bold text-foreground mb-4">
                  {step.title}
                </h3>

                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tablet Display com Imagem */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="card-premium p-3 sm:p-4 md:p-6"
        >
          <a 
            href="https://movello-tablet.lovable.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black block group cursor-pointer"
            style={{ 
              aspectRatio: isMobile ? '9/16' : '16/10', 
              maxHeight: isMobile ? 'none' : '600px' 
            }}
          >
            <img 
              src={tabletInteracao}
              alt="Tablet exibindo anúncio no carro"
              className="w-full h-full object-cover rounded-2xl sm:rounded-3xl blur-md group-hover:blur-sm transition-all duration-300"
              onError={(e) => {
                // Fallback para a imagem original se não carregar
                e.currentTarget.src = heroImage;
              }}
            />
            {/* Overlay com botão */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors duration-300 rounded-2xl sm:rounded-3xl">
              <div className="bg-white/95 hover:bg-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl shadow-2xl flex items-center gap-3 group-hover:scale-105 transition-transform duration-300">
                <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <span className="text-base sm:text-lg font-semibold text-foreground">
                  Ver tablet interativo
                </span>
              </div>
            </div>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

import { motion } from "framer-motion";
import { Settings, MapPin, QrCode } from "lucide-react";

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
];

const HowItWorksSection = () => {
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
            3 passos simples para atrair
            <br />
            <span className="text-gradient-primary">clientes todos os dias</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[calc(50%+60px)] w-[calc(100%-120px)] h-0.5 bg-gradient-to-r from-primary/30 to-primary/10" />
              )}

              <div className="card-premium p-8 h-full hover:-translate-y-2 transition-transform duration-300">
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
      </div>
    </section>
  );
};

export default HowItWorksSection;

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, Building2, Check, DollarSign, BarChart3, Shield } from "lucide-react";

const driverBenefits = [
  { icon: DollarSign, text: "Ganhe renda extra passiva" },
  { icon: Shield, text: "Tablet instalado gratuitamente" },
  { icon: BarChart3, text: "Acompanhe seus ganhos em tempo real" },
];

const businessBenefits = [
  { icon: Check, text: "Anúncios geolocalizados" },
  { icon: Check, text: "Métricas em tempo real" },
  { icon: Check, text: "Suporte dedicado" },
];

const DualCTASection = () => {
  return (
    <section className="section-padding bg-background relative overflow-hidden">
      <div className="container-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground">
            Faça parte da <span className="text-gradient-primary">Movello</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 relative">
          {/* Drivers Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="card-premium p-6 md:p-8 lg:p-10"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center">
                <Car className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold text-foreground">
                  Para Motoristas
                </h3>
                <p className="text-muted-foreground">Ganhe dinheiro exibindo anúncios</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {driverBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                    <benefit.icon className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-foreground">{benefit.text}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <Button variant="accent" size="lg" className="w-full" asChild>
                <a href="/cadastro-motorista">Quero ser motorista parceiro</a>
              </Button>
            </div>
          </motion.div>

          {/* Businesses Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-primary to-movello-blue-dark rounded-3xl p-6 md:p-8 lg:p-10 text-primary-foreground"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-primary-foreground/20 rounded-2xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-display font-bold">
                  Para Empresas
                </h3>
                <p className="text-primary-foreground/80">Anuncie com precisão</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {businessBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
                    <benefit.icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span>{benefit.text}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <Button 
                variant="secondary" 
                size="lg" 
                className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                asChild
              >
                <a href="/cadastro-empresa">Quero anunciar agora</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DualCTASection;

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Car } from "lucide-react";
import { useState } from "react";
import heroImage from "@/assets/hero-tablet-mockup.jpg";

const ReadyToAdvertiseSection = () => {
  const [isCompany, setIsCompany] = useState(true);

  return (
    <section className="section-padding bg-background">
      <div className="container-section">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Toggle Buttons */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setIsCompany(true)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  isCompany
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Building2 className="w-5 h-5" />
                Empresa
              </button>
              <button
                onClick={() => setIsCompany(false)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  !isCompany
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Car className="w-5 h-5" />
                Motorista
              </button>
            </div>

            {isCompany ? (
              <>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground">
                  Pronto para anunciar com{" "}
                  <span className="text-gradient-primary">precisão e visibilidade real?</span>
                </h2>
                <p className="text-lg lg:text-xl text-muted-foreground">
                  Junte-se a centenas de empresas que já estão conquistando clientes todos os dias com a Movello.
                </p>
                <Button variant="hero" size="xl" className="group">
                  Quero trabalhar agora com a Movello
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </>
            ) : (
              <>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground">
                  Ganhe renda extra{" "}
                  <span className="text-gradient-primary">exibindo anúncios</span>
                </h2>
                <p className="text-lg lg:text-xl text-muted-foreground">
                  Seja um motorista parceiro e ganhe dinheiro enquanto dirige. Tablet instalado gratuitamente.
                </p>
                <Button variant="hero" size="xl" className="group">
                  Quero ser motorista parceiro
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </>
            )}
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <img 
              src={heroImage} 
              alt={isCompany ? "Empresa anunciando" : "Motorista parceiro"}
              className="w-full h-auto rounded-3xl shadow-2xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ReadyToAdvertiseSection;


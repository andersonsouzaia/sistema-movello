import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Car } from "lucide-react";
import { useState } from "react";
import heroImage from "@/assets/hero-tablet.png";

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
                {/* Seção EMPRESA */}
                <div className="space-y-6">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground">
                    Anuncie exatamente <span className="text-gradient-primary">onde seus clientes estão!</span>
                  </h2>
                  <p className="text-lg lg:text-xl font-semibold text-foreground">
                    Impacte pessoas reais, na sua região, no momento certo.
                  </p>
                  <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                    Com a Movello, sua marca aparece em carros de aplicativo que circulam próximos ao seu negócio, gerando visibilidade local real e alcance qualificado.
                    Descubra como empresas estão utilizando a Movello para atrair clientes todos os dias.
                  </p>
                  <div className="space-y-3">
                    <Button variant="hero" size="xl" className="group" asChild>
                      <a href="/cadastro-empresa">
                        Quero anunciar agora
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </a>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Seção MOTORISTA */}
                <div className="space-y-6">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground">
                    <span className="text-gradient-primary">Renda extra</span> sem mudar sua rotina!
                  </h2>
                  <p className="text-lg lg:text-xl font-semibold text-foreground">
                    Veja como motoristas estão gerando renda extra com a Movello, apenas dirigindo normalmente.
                  </p>
                  <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                    Seja motorista parceiro Movello e ganhe dinheiro exibindo anúncios no seu carro, com tablet instalado gratuitamente.
                    Sem custo para você, sem exclusividade e sem alterar sua rotina de trabalho.
                  </p>
                  <div className="space-y-3">
                    <Button variant="hero" size="xl" className="group" asChild>
                      <a href="/cadastro-motorista">
                        Quero ser motorista parceiro
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </a>
                    </Button>
                  </div>
                </div>
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


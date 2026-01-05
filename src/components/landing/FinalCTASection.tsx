import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import movelloLogo from "@/assets/movello-logo.png";
import movellinhoMascote from "@/assets/movellinho-mascote.png";

const FinalCTASection = () => {
  return (
    <section className="section-padding bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container-section relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-display font-bold text-foreground mb-6">
            Pronto para anunciar com{" "}
            <span className="text-gradient-primary">precisão e visibilidade real?</span>
          </h2>

          <p className="text-lg lg:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Junte-se a centenas de empresas que já estão conquistando clientes todos os dias com a Movello.
          </p>

          <Button variant="hero" size="xl" className="group">
            Quero anunciar agora
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>

          {/* Floating Mascot */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mt-12 inline-flex items-center gap-4 px-6 py-3 bg-primary/5 rounded-full"
          >
            <img 
              src={movellinhoMascote} 
              alt="Movellinho" 
              className="w-14 h-14 object-contain"
            />
            <span className="text-foreground font-medium">
              Movellinho te espera para começar!
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const FooterSection = () => {
  return (
    <footer className="py-12 bg-foreground">
      <div className="container-section">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img 
              src={movelloLogo} 
              alt="Movello" 
              className="h-10 w-auto brightness-0 invert"
            />
          </div>

          <nav className="flex items-center gap-8">
            <a href="#como-funciona" className="text-background/70 hover:text-background transition-colors">
              Como funciona
            </a>
            <a href="#beneficios" className="text-background/70 hover:text-background transition-colors">
              Benefícios
            </a>
            <a href="#faq" className="text-background/70 hover:text-background transition-colors">
              FAQ
            </a>
          </nav>

          <p className="text-background/50 text-sm">
            © 2024 Movello. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export { FinalCTASection, FooterSection };

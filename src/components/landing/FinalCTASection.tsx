import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";

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
            className="mt-12 inline-flex items-center gap-3 px-6 py-3 bg-primary/5 rounded-full"
          >
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-glow-primary">
              <span className="text-2xl">🚗</span>
            </div>
            <span className="text-foreground font-medium">
              Movelinho te espera para começar!
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
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold text-background">Movello</span>
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

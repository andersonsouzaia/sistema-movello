import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, MapPin } from "lucide-react";
import heroImage from "@/assets/woman-movello-tablet.png";
import movelloLogo from "@/assets/movello-logo.png";
import movellinhoMascote from "@/assets/movellinho-mascote.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-movello-orange/10 rounded-full blur-3xl" />
      </div>

      {/* Sticky Header - Branco */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="container-section">
          <div className="flex items-center justify-between py-4">
            {/* Logo à esquerda */}
            <div className="flex items-center gap-2">
              <img 
                src={movelloLogo} 
                alt="Movello" 
                className="h-10 sm:h-12 w-auto"
              />
            </div>
            {/* Links centralizados */}
            <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
              <a href="#como-funciona" className="text-foreground hover:text-primary transition-colors">Como funciona</a>
              <a href="#beneficios" className="text-foreground hover:text-primary transition-colors">Benefícios</a>
              <a href="#faq" className="text-foreground hover:text-primary transition-colors">FAQ</a>
            </nav>
            {/* Botões à direita - sem animação de hover */}
            <div className="hidden md:flex items-center gap-4">
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold h-9">Baixar App</button>
              <a href="/login" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold h-9">Entrar</a>
            </div>
          </div>
        </div>
      </header>

      <div className="container-section relative z-10">

        {/* Hero Content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center pt-32 lg:pt-40 pb-20">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-sm font-medium text-secondary-foreground">
                +1.000.000 de impressões/mês em cidades parceiras
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-tight text-foreground">
              Atraia clientes reais com anúncios em{" "}
              <span className="text-gradient-primary">carros de aplicativo</span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground max-w-xl">
              Seu anúncio aparece em tablets dentro dos veículos, exatamente dentro do raio que você escolher.{" "}
              <strong className="text-foreground">100% rastreável, zero desperdício.</strong>
            </p>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Button variant="hero" size="lg" asChild>
                  <a href="/cadastro-empresa">Quero anunciar agora</a>
                </Button>

                <Button variant="hero-outline" size="lg" asChild>
                  <a href="#como-funciona">
                    <Play className="w-5 h-5" />
                    Ver como funciona
                  </a>
                </Button>
              </div>

              <a
                href="/cadastro-motorista"
                className="text-sm sm:text-base font-semibold text-movello-orange hover:text-movello-orange/80 sm:self-start"
              >
                Quero ser motorista parceiro
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-background" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">+500 empresas anunciando</span>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden">
              <img 
                src={heroImage} 
                alt="Passageira escaneando QR code no tablet Movello"
                className="w-full h-auto rounded-3xl shadow-2xl"
              />
            </div>

            {/* Movelinho Mascot */}
            <motion.img
              src={movellinhoMascote}
              alt="Movellinho"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 -right-4 w-24 h-24 object-contain drop-shadow-xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

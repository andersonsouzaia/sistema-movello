import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, MapPin } from "lucide-react";
import heroImage from "@/assets/hero-tablet-mockup.jpg";
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

      <div className="container-section relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2">
            <img 
              src={movelloLogo} 
              alt="Movello" 
              className="h-12 w-auto"
            />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#como-funciona" className="text-muted-foreground hover:text-foreground transition-colors">Como funciona</a>
            <a href="#beneficios" className="text-muted-foreground hover:text-foreground transition-colors">Benefícios</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            <Button variant="outline" size="sm">Entrar</Button>
          </nav>
        </header>

        {/* Hero Content */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center pt-12 lg:pt-20 pb-20">
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

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg">
                Quero anunciar agora
              </Button>
              <Button variant="hero-outline" size="lg">
                <Play className="w-5 h-5" />
                Ver como funciona
              </Button>
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
            <div className="relative rounded-3xl overflow-visible">
              <img 
                src={heroImage} 
                alt="Tablet exibindo anúncio geolocalizado em carro de aplicativo"
                className="w-full h-auto rounded-3xl shadow-2xl"
              />
              
              {/* Floating Stats Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="absolute -left-2 sm:left-4 top-8 bg-background p-4 rounded-2xl shadow-xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">2km</p>
                    <p className="text-sm text-muted-foreground">Raio configurável</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating Impressions Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="absolute right-4 sm:right-8 bottom-4 sm:bottom-8 bg-background p-4 rounded-2xl shadow-xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <span className="text-xl">📊</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">98%</p>
                    <p className="text-sm text-muted-foreground">Taxa de visibilidade</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Movelinho Mascot */}
            <motion.img
              src={movellinhoMascote}
              alt="Movellinho"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 right-4 w-28 h-28 object-contain drop-shadow-xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

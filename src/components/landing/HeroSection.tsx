import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import heroImage from "@/assets/woman-movello-tablet.png";
import movelloLogo from "@/assets/movello-logo.png";
import movellinhoMascote from "@/assets/movellinho-mascote.png";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const HeroSection = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            {/* Links centralizados - Desktop */}
            <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
              <a href="#como-funciona" className="text-foreground hover:text-primary transition-colors">Como funciona</a>
              <a href="#beneficios" className="text-foreground hover:text-primary transition-colors">Benefícios e diferenciais</a>
              <a href="#faq" className="text-foreground hover:text-primary transition-colors">FAQ</a>
            </nav>
            {/* Botões à direita - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              <a href="/login" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold h-9">Entrar</a>
            </div>
            {/* Botão Menu Mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Menu Mobile */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="text-left">Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-6 mt-8">
            {/* Links de navegação */}
            <nav className="flex flex-col gap-4">
              <a 
                href="#como-funciona" 
                className="text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Como funciona
              </a>
              <a 
                href="#beneficios" 
                className="text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Benefícios e diferenciais
              </a>
              <a 
                href="#faq" 
                className="text-foreground hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </a>
            </nav>
            
            {/* Separador */}
            <div className="border-t border-border" />
            
            {/* Botões de ação */}
            <div className="flex flex-col gap-3">
              <a 
                href="/login" 
                className="bg-primary text-primary-foreground px-4 py-3 rounded-lg text-sm font-semibold text-center w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                Entrar
              </a>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
              Plataforma de publicidade em mobilidade que transforma veículos de aplicativo em canais de comunicação de alto impacto.{" "}
              <strong className="text-foreground">Conectamos marcas ao público certo durante os deslocamentos.</strong>
            </p>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Button variant="hero" size="lg" asChild>
                  <a href="/cadastro-empresa">Quero anunciar agora</a>
                </Button>

                <Button variant="accent" size="lg" asChild>
                  <a href="/cadastro-motorista">Quero ser motorista parceiro</a>
                </Button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 pt-2">
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
            </div>

            {/* Movelinho Mascot */}
            <motion.img
              src={movellinhoMascote}
              alt="Movellinho"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-28 h-28 object-contain drop-shadow-xl"
              style={{
                left: '512px',
                top: '246px',
                zIndex: 10,
                right: 'auto',
                bottom: 'auto'
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

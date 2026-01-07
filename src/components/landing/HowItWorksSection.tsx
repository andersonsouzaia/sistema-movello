import { motion } from "framer-motion";
import { Settings, MapPin, Megaphone, QrCode } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import heroImage from "@/assets/hero-tablet.png";

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
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const isMobile = useIsMobile();
  
  // Extrair apenas o ID do vídeo (remover parâmetros adicionais)
  const youtubeVideoId = "CeItO4-ARfk"; // ID correto sem "?si=..."
  const hasVideo = !!youtubeVideoId;
  const youtubeThumbnail = hasVideo ? `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg` : heroImage;
  
  // URL do embed com parâmetros para ocultar informações e manter apenas play/pause
  // Adicionando parâmetros extras para remover vídeos relacionados
  const youtubeEmbedUrl = hasVideo 
    ? `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0&modestbranding=1&controls=1&showinfo=0&fs=0&iv_load_policy=3&cc_load_policy=0&disablekb=1&playsinline=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}&enablejsapi=0&widget_referrer=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`
    : "";

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

        {/* Tablet Display com Vídeo YouTube */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="card-premium p-3 sm:p-4 md:p-6"
        >
          <div 
            className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black ${hasVideo ? 'cursor-pointer' : ''}`}
            style={{ 
              aspectRatio: isMobile ? '9/16' : '16/10', 
              maxHeight: isMobile ? 'none' : '600px' 
            }}
            onClick={() => hasVideo && setIsVideoPlaying(true)}
          >
            {!isVideoPlaying || !hasVideo ? (
              <>
                {/* Thumbnail do YouTube com botão de play ou imagem estática */}
                <div className="relative w-full h-full">
                  <img 
                    src={youtubeThumbnail}
                    alt="Tablet exibindo anúncio no carro"
                    className="w-full h-full object-cover rounded-2xl sm:rounded-3xl"
                    onError={(e) => {
                      // Fallback para a imagem original se o thumbnail não carregar
                      e.currentTarget.src = heroImage;
                    }}
                  />
                  {/* Overlay escuro com botão de play apenas se houver vídeo */}
                  {hasVideo && (
                    <div className="absolute inset-0 bg-black/30 rounded-2xl sm:rounded-3xl flex items-center justify-center group hover:bg-black/40 transition-colors">
                      {/* Botão de play */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/90 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                        <svg 
                          className="w-8 h-8 sm:w-10 sm:h-10 text-primary ml-1" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Player do YouTube quando clicado - modo minimalista */
              <div className="absolute inset-0 w-full h-full">
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-2xl sm:rounded-3xl"
                  src={youtubeEmbedUrl}
                  title="Vídeo demonstrativo Movello"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen={false}
                  frameBorder="0"
                  style={{
                    objectFit: 'cover',
                    pointerEvents: 'auto'
                  }}
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

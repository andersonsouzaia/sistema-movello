import { cn } from '@/lib/utils';
import { Tablet, Smartphone } from 'lucide-react';
import QRCode from 'react-qr-code';

interface TabletPreviewProps {
  mediaUrl?: string; // URL da imagem ou vídeo
  qrCodeLink?: string; // Link para gerar o QR Code
  className?: string;
  orientation?: 'landscape' | 'portrait';
  title?: string;
  description?: string;
}

export function TabletPreview({
  mediaUrl,
  qrCodeLink,
  className,
  orientation = 'landscape',
  title,
  description,
}: TabletPreviewProps) {
  // Dimensões relativas para simular proporção de tablet (aprox 16:10 ou 4:3)
  const isLandscape = orientation === 'landscape';

  return (
    <div className={cn("relative flex items-center justify-center p-4", className)}>
      {/* Moldura do Tablet */}
      <div
        className={cn(
          "relative bg-black rounded-[32px] shadow-2xl border-8 border-gray-900 overflow-hidden",
          isLandscape ? "w-[600px] h-[375px]" : "w-[375px] h-[600px]"
        )}
      >
        {/* Tela */}
        <div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
          {mediaUrl ? (
            // Mídia (Imagem ou Vídeo)
            // Se for vídeo, usar tag video. Se imagem, img.
            // Para MVP simples, vamos assumir imagem ou detectar extensão básica.
            (mediaUrl.match(/\.(mp4|webm|ogg)$/i)) ? (
              <video
                src={mediaUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img
                src={mediaUrl}
                alt="Campanha Preview"
                className="w-full h-full object-cover"
              />
            )
          ) : (
            // Placeholder se sem mídia
            <div className="text-gray-500 flex flex-col items-center gap-2">
              <Tablet className="h-16 w-16 opacity-20" />
              <span className="text-sm opacity-50">Sua mídia aparecerá aqui</span>
            </div>
          )}

          {/* Text Overlay (Title & Description) */}
          {(title || description) && (
            <div className="absolute bottom-6 left-6 max-w-[60%] text-white text-shadow-sm z-10 pointer-events-none">
              {title && (
                <h3 className="text-xl font-bold leading-tight mb-1 drop-shadow-md">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm opacity-90 font-medium leading-snug drop-shadow-md line-clamp-2">
                  {description}
                </p>
              )}
            </div>
          )}

          {/* QR Code Overlay */}
          {qrCodeLink && (
            <div className={cn(
              "absolute bg-white/90 p-3 rounded-xl shadow-lg transition-all duration-300",
              // Posicionamento do QR Code (Canto inferior direito geralmente)
              "bottom-6 right-6"
            )}>
              <div className="h-24 w-24">
                <QRCode
                  value={qrCodeLink}
                  size={256}
                  style={{ height: "100%", width: "100%", maxWidth: "100%" }}
                  viewBox={`0 0 256 256`}
                />
              </div>

            </div>
          )}
        </div>

        {/* Câmera Frontal (Detalhe visual) */}
        <div className={cn(
          "absolute bg-gray-800 rounded-full",
          isLandscape ? "w-2 h-2 left-4 top-1/2 -translate-y-1/2" : "w-2 h-2 top-4 left-1/2 -translate-x-1/2"
        )} />
      </div>

      {/* Brilho da tela (Efeito vidro) */}
      <div className={cn(
        "absolute inset-0 pointer-events-none rounded-[30px]",
        "bg-gradient-to-tr from-white/5 to-transparent opacity-20"
      )} />

    </div>
  );
}

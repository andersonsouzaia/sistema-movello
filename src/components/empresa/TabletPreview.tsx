import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tablet, Maximize2, Minimize2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TabletPreviewProps {
  midiaUrl: string
  tipo: 'imagem' | 'video'
  className?: string
  trigger?: React.ReactNode
}

export function TabletPreview({ midiaUrl, tipo, className, trigger }: TabletPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const content = (
    <div
      className={cn(
        "relative mx-auto bg-black rounded-lg overflow-hidden shadow-2xl",
        "border-8 border-gray-800",
        isFullscreen ? "w-full h-[80vh]" : "w-[768px] h-[1024px] max-w-full",
        className
      )}
      style={{
        aspectRatio: '3/4',
        maxHeight: isFullscreen ? '80vh' : '1024px',
        maxWidth: isFullscreen ? '100%' : '768px',
      }}
    >
      {/* Simulação de bordas do tablet */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-2 bg-black rounded-t-lg" />
      </div>
      
      {/* Conteúdo da mídia */}
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        {tipo === 'imagem' ? (
          <img
            src={midiaUrl}
            alt="Preview Tablet"
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            src={midiaUrl}
            controls
            className="w-full h-full object-contain"
            autoPlay
            loop
            muted
          />
        )}
      </div>

      {/* Botão de fullscreen */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="bg-black/50 hover:bg-black/70 text-white"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )

  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <div onClick={() => setIsOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tablet className="h-5 w-5" />
              Preview em Tablet
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-4">
            {content}
          </div>
          <div className="text-center text-sm text-muted-foreground mt-4">
            <p>Resolução: 768x1024 (iPad Portrait)</p>
            <p className="text-xs mt-1">Este é um preview aproximado</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Tablet className="h-5 w-5" />
          Preview em Tablet
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center items-center">
          {content}
        </div>
        <div className="text-center text-sm text-muted-foreground mt-4">
          <p>Resolução: 768x1024 (iPad Portrait)</p>
          <p className="text-xs mt-1">Este é um preview aproximado</p>
        </div>
      </CardContent>
    </Card>
  )
}



import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Image as ImageIcon, Video, Upload, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MidiaUploaderProps {
  onUpload: (file: File, tipo: 'imagem' | 'video') => Promise<void>
  tipo?: 'imagem' | 'video'
  maxSize?: number // em bytes
  maxFiles?: number
  multiple?: boolean
  className?: string
  disabled?: boolean
}

export function MidiaUploader({
  onUpload,
  tipo = 'imagem',
  maxSize = 10 * 1024 * 1024, // 10MB padrão
  maxFiles = 1,
  multiple = false,
  className,
  disabled = false,
}: MidiaUploaderProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const validateFile = (file: File): string | null => {
    // Validar tipo
    if (tipo === 'imagem' && !file.type.startsWith('image/')) {
      return 'Arquivo deve ser uma imagem'
    }
    if (tipo === 'video' && !file.type.startsWith('video/')) {
      return 'Arquivo deve ser um vídeo'
    }

    // Validar tamanho
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
      return `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`
    }

    return null
  }

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return

    const fileArray = Array.from(fileList)
    const validFiles: File[] = []
    const errors: string[] = []

    fileArray.forEach((file) => {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error))
    }

    if (validFiles.length > 0) {
      if (multiple) {
        setFiles((prev) => [...prev, ...validFiles].slice(0, maxFiles))
      } else {
        setFiles(validFiles.slice(0, maxFiles))
      }
    }
  }, [tipo, maxSize, maxFiles, multiple])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Selecione pelo menos um arquivo')
      return
    }

    setUploading(true)
    try {
      for (const file of files) {
        await onUpload(file, tipo)
      }
      setFiles([])
      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso!`)
    } catch (error) {
      // Erro já é tratado no callback
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Área de Upload */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex flex-col items-center gap-4">
          {tipo === 'imagem' ? (
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          ) : (
            <Video className="h-12 w-12 text-muted-foreground" />
          )}
          <div>
            <Label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-primary hover:underline">
                Clique para selecionar
              </span>
              {' ou arraste arquivos aqui'}
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept={tipo === 'imagem' ? 'image/*' : 'video/*'}
              multiple={multiple}
              onChange={handleFileInput}
              className="hidden"
              disabled={disabled}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {tipo === 'imagem' ? 'JPG, PNG, GIF' : 'MP4, AVI, MOV'} • Máximo {(maxSize / (1024 * 1024)).toFixed(0)}MB
            {multiple && ` • Até ${maxFiles} arquivos`}
          </p>
        </div>
      </div>

      {/* Preview de Arquivos */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Arquivos selecionados ({files.length})</p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {tipo === 'imagem' && file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploading || disabled}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Enviar {files.length} arquivo(s)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}


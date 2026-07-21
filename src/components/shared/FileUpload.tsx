import { useRef, useState } from 'react'
import { Upload, X, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FileUploadProps {
  value?: string | null
  onChange: (file: File) => void
  onRemove?: () => void
  accept?: string
  maxSize?: number // MB
  shape?: 'circle' | 'square'
  label?: string
  className?: string
}

export function FileUpload({
  value,
  onChange,
  onRemove,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 5,
  shape = 'circle',
  label = 'Upload photo',
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(value ?? null)

  const handleFile = (file: File) => {
    setError(null)
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File must be smaller than ${maxSize}MB`)
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
    onChange(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleRemove = () => {
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
    onRemove?.()
  }

  const displayUrl = preview ?? value

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed transition-colors cursor-pointer hover:border-violet-400 group',
          shape === 'circle' ? 'rounded-full w-24 h-24' : 'rounded-2xl w-full h-32',
          displayUrl ? 'border-transparent' : 'border-muted-foreground/30'
        )}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Upload preview"
            className={cn(
              'w-full h-full object-cover',
              shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
            )}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
            {shape === 'circle' ? (
              <User className="h-8 w-8 text-muted-foreground" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground text-center">{label}</p>
              </>
            )}
          </div>
        )}

        {/* Hover overlay */}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40',
          shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
        )}>
          <Upload className="h-5 w-5 text-white" />
        </div>
      </div>

      {displayUrl && onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-red-500 hover:text-red-600 text-xs"
        >
          <X className="h-3 w-3 mr-1" /> Remove
        </Button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}

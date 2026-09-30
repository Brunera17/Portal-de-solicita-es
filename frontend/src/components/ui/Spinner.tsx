import { cn } from '@/lib/cn'
import { LoaderCircle } from 'lucide-react'

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle aria-hidden className={cn('animate-spin', className ?? 'size-5')} />
}

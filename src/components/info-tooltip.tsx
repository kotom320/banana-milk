'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function InfoTooltip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex items-center justify-center size-4 rounded-full text-[10px] font-bold border border-muted-foreground/40 text-muted-foreground hover:border-foreground/60 hover:text-foreground transition-colors shrink-0"
        aria-label="설명 보기"
      >
        i
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64 text-xs leading-relaxed whitespace-pre-line">
        {children}
      </TooltipContent>
    </Tooltip>
  )
}

import { cn } from "@/lib/utils"

type Props = {
  options: string[]
  selected: string | null
  onSelect: (option: string) => void
  disabled?: boolean
}

export function AnswerChips({ options, selected, onSelect, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(option)}
          className={cn(
            "rounded-xl border px-4 py-3 text-sm font-medium text-left transition-all",
            "hover:border-primary hover:bg-primary/5 active:scale-[0.98]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selected === option
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-foreground",
            disabled && "pointer-events-none opacity-60",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

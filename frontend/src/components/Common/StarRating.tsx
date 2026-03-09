import { Star } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

type StarRatingProps = {
  value: number | null
  onChange?: (value: number | null) => void
  max?: number
  readOnly?: boolean
}

export function StarRating({
  value,
  onChange,
  max = 5,
  readOnly = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const displayValue = hoverValue ?? value ?? 0

  const handleClick = (newValue: number) => {
    if (readOnly || !onChange) return
    // Click same value to clear
    onChange(value === newValue ? null : newValue)
  }

  const handleMouseLeave = () => {
    if (readOnly) return
    setHoverValue(null)
  }

  return (
    <div
      role="radiogroup"
      aria-label={`Rating: ${value ?? "none"} out of ${max}`}
      className={cn("inline-flex gap-0.5", !readOnly && "cursor-pointer")}
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: max }, (_, i) => {
        const starIndex = i + 1
        const leftHalfValue = starIndex - 0.5
        const rightHalfValue = starIndex

        const leftFilled = displayValue >= leftHalfValue
        const rightFilled = displayValue >= rightHalfValue

        return (
          <div key={i} className="relative size-7" aria-hidden="true">
            {/* Background (empty) star */}
            <Star className="absolute inset-0 size-7 text-muted-foreground/25 transition-colors duration-150" />

            {/* Filled star with clip paths for half-star support */}
            {(leftFilled || rightFilled) && (
              <>
                {leftFilled && (
                  <Star
                    className="absolute inset-0 size-7 fill-amber-400 text-amber-400 transition-colors duration-150"
                    style={{
                      clipPath: rightFilled ? undefined : "inset(0 50% 0 0)",
                    }}
                  />
                )}
                {rightFilled && !leftFilled && (
                  <Star
                    className="absolute inset-0 size-7 fill-amber-400 text-amber-400 transition-colors duration-150"
                    style={{ clipPath: "inset(0 0 0 50%)" }}
                  />
                )}
              </>
            )}

            {/* Click zones — left half and right half */}
            {!readOnly && (
              <>
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 w-1/2 z-10"
                  aria-label={`${leftHalfValue} star${leftHalfValue !== 1 ? "s" : ""}`}
                  onClick={() => handleClick(leftHalfValue)}
                  onMouseEnter={() => setHoverValue(leftHalfValue)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 w-1/2 z-10"
                  aria-label={`${rightHalfValue} star${rightHalfValue !== 1 ? "s" : ""}`}
                  onClick={() => handleClick(rightHalfValue)}
                  onMouseEnter={() => setHoverValue(rightHalfValue)}
                />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

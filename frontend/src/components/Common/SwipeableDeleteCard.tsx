import { useDrag } from "@use-gesture/react"
import { Trash2 } from "lucide-react"
import { useRef, useState } from "react"

interface SwipeableDeleteCardProps {
  onDelete: () => void
  isDeleting: boolean
  children: React.ReactNode
}

export function SwipeableDeleteCard({
  onDelete,
  isDeleting,
  children,
}: SwipeableDeleteCardProps) {
  const [offsetX, setOffsetX] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const THRESHOLD_RATIO = 0.3

  const bind = useDrag(
    ({ active, movement: [mx], velocity: [vx], direction: [dx] }) => {
      if (isDeleting) return

      // Only allow leftward swipe
      if (mx > 5) {
        setOffsetX(0)
        return
      }

      const containerWidth = containerRef.current?.offsetWidth ?? 300
      const threshold = containerWidth * THRESHOLD_RATIO

      if (active) {
        // Clamp: don't let it go beyond container width
        setOffsetX(Math.max(mx, -containerWidth * 0.6))
      } else {
        // Released
        const pastThreshold = Math.abs(mx) > threshold || (vx > 0.5 && dx < 0)

        if (pastThreshold) {
          // Animate card off-screen briefly, then reset
          setIsAnimating(true)
          setOffsetX(-containerWidth * 0.6)
          setTimeout(() => {
            onDelete()
            setOffsetX(0)
            setTimeout(() => setIsAnimating(false), 50)
          }, 250)
        } else {
          // Spring back
          setIsAnimating(true)
          setOffsetX(0)
          setTimeout(() => setIsAnimating(false), 300)
        }
      }
    },
    {
      axis: "x",
      filterTaps: true,
      pointer: { touch: true },
    },
  )

  const containerWidth = containerRef.current?.offsetWidth ?? 300
  const progress = Math.min(
    Math.abs(offsetX) / (containerWidth * THRESHOLD_RATIO),
    1,
  )
  const isPastThreshold = progress >= 1

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-2xl">
      {/* Background action strip */}
      <div
        className={`ticket-card absolute inset-0 flex items-center justify-end px-6 transition-colors duration-150 ${
          isPastThreshold ? "bg-destructive" : "bg-destructive/80"
        }`}
      >
        <div className="flex items-center gap-2 text-white font-medium text-sm">
          <Trash2
            className={`size-5 transition-transform duration-150 ${isPastThreshold ? "scale-125" : ""}`}
          />
          <span>Delete</span>
        </div>
      </div>

      {/* Draggable card layer */}
      <div
        {...bind()}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isAnimating
            ? "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)"
            : "none",
          touchAction: "pan-y",
          opacity: isDeleting ? 0.5 : 1,
        }}
        className="relative z-10"
      >
        {children}
      </div>
    </div>
  )
}

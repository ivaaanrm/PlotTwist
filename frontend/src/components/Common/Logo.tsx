import { Link } from "@tanstack/react-router"
import { Clapperboard } from "lucide-react"

import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "full" | "icon" | "responsive"
  className?: string
  asLink?: boolean
}

export function Logo({
  variant = "full",
  className,
  asLink = true,
}: LogoProps) {
  const iconElement = (
    <Clapperboard className={cn("size-5 text-primary", className)} />
  )

  const fullElement = (
    <div className={cn("flex items-center gap-2", className)}>
      <Clapperboard className="size-6 text-primary" />
      <span className="text-xl font-bold tracking-tight">PlotTwist</span>
    </div>
  )

  const content =
    variant === "responsive" ? (
      <>
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <Clapperboard className="size-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">PlotTwist</span>
        </div>
        <div className="hidden group-data-[collapsible=icon]:block">
          {iconElement}
        </div>
      </>
    ) : variant === "full" ? (
      fullElement
    ) : (
      iconElement
    )

  if (!asLink) {
    return content
  }

  return <Link to="/">{content}</Link>
}

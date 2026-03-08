import { Clapperboard } from "lucide-react"

import { Appearance } from "@/components/Common/Appearance"
import { Footer } from "./Footer"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-muted dark:bg-zinc-900 relative hidden lg:flex lg:flex-col lg:items-center lg:justify-center gap-6">
        <div className="flex items-center gap-3">
          <Clapperboard className="size-12 text-primary" />
          <span className="text-4xl font-bold tracking-tight">PlotTwist</span>
        </div>
        <p className="text-muted-foreground text-lg max-w-sm text-center">
          Track films you've watched. Save those you want to see. Tell your
          friends what's good.
        </p>
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-end">
          <Appearance />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
        <Footer />
      </div>
    </div>
  )
}

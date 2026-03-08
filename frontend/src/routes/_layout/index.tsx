import { createFileRoute } from "@tanstack/react-router"
import { Film } from "lucide-react"

import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/")({
  component: Home,
  head: () => ({
    meta: [
      {
        title: "Home - PlotTwist",
      },
    ],
  }),
})

function Home() {
  const { user: currentUser } = useAuth()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {currentUser?.full_name || currentUser?.email}
        </h1>
        <p className="text-muted-foreground">
          Here's what your friends have been watching
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-5 mb-5">
          <Film className="size-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Your feed is empty</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Follow other users to see their recent watches and reviews here. Start
          by discovering films and logging what you've watched.
        </p>
      </div>
    </div>
  )
}

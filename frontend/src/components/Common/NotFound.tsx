import { Link } from "@tanstack/react-router"
import { Film } from "lucide-react"

import { Button } from "@/components/ui/button"

const NotFound = () => {
  return (
    <div
      className="flex min-h-screen items-center justify-center flex-col p-4"
      data-testid="not-found"
    >
      <div className="rounded-full bg-muted p-5 mb-6">
        <Film className="size-10 text-muted-foreground" />
      </div>
      <span className="text-6xl md:text-8xl font-bold leading-none mb-4">
        404
      </span>
      <p className="text-lg text-muted-foreground mb-6 text-center">
        This scene doesn't exist. The page you're looking for was not found.
      </p>
      <Link to="/">
        <Button>Back to Home</Button>
      </Link>
    </div>
  )
}

export default NotFound

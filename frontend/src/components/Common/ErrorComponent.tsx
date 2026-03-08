import { Link } from "@tanstack/react-router"
import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"

const ErrorComponent = () => {
  return (
    <div
      className="flex min-h-screen items-center justify-center flex-col p-4"
      data-testid="error-component"
    >
      <div className="rounded-full bg-destructive/10 p-5 mb-6">
        <AlertTriangle className="size-10 text-destructive" />
      </div>
      <span className="text-2xl font-bold mb-2">Something went wrong</span>
      <p className="text-lg text-muted-foreground mb-6 text-center">
        An unexpected error occurred. Please try again.
      </p>
      <Link to="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  )
}

export default ErrorComponent

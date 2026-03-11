import { TicketCard } from "./TicketCard"
import type { RecommendationTicket } from "@/features/recommendations/api"

type Props = {
  tickets: RecommendationTicket[]
  onRestart: () => void
}

export function TicketReveal({ tickets, onRestart }: Props) {
  return (
    <div className="flex flex-col gap-8 w-full max-w-lg mx-auto px-4 pb-12">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Your picks are ready 🎬</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Curated just for you based on your answers
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {tickets.map((ticket, i) => (
          <TicketCard
            key={ticket.tmdb_id}
            ticket={ticket}
            style={{ animationDelay: `${i * 150}ms`, animationFillMode: "both" }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors mx-auto"
      >
        Start over
      </button>
    </div>
  )
}

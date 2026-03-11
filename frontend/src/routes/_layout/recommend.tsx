import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { useEffect, useMemo, useReducer, useState } from "react"
import { MediaDetailDialog } from "@/components/Common/MediaDetailDialog"
import { TicketReveal } from "@/components/recommendations/TicketReveal"
import { WelcomeScreen } from "@/components/recommendations/WelcomeScreen"
import { WizardCard } from "@/components/recommendations/WizardCard"
import {
  type FeedItemPublic,
  MovieDomainService,
} from "@/features/movie-domain/api"
import {
  type QuestionResponse,
  RecommendationsService,
  type RecommendationTicket,
} from "@/features/recommendations/api"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/recommend")({
  component: Recommend,
  head: () => ({
    meta: [{ title: "For You - PlotTwist" }],
  }),
})

// ─── Discovering Loader ────────────────────────────────────────────────────────

const DISCOVERING_MESSAGES = [
  "Analyzing your answers...",
  "Consulting the archives...",
  "Finding perfect matches...",
  "Crossing genres...",
  "Preparing your tickets...",
]

function DiscoveringLoader() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % DISCOVERING_MESSAGES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-500">
      <div className="relative flex items-center justify-center">
        <div className="absolute size-16 rounded-full bg-primary/20 animate-ping duration-1000" />
        <div className="relative z-10 bg-background rounded-full p-3 shadow-sm border">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </div>

      <div className="h-6 overflow-hidden relative w-full max-w-[200px] text-center">
        {DISCOVERING_MESSAGES.map((msg, i) => (
          <p
            key={msg}
            className={`absolute inset-0 w-full text-sm font-medium transition-all duration-500 ${
              i === messageIndex
                ? "opacity-100 translate-y-0 text-foreground"
                : "opacity-0 translate-y-4 text-muted-foreground"
            }`}
          >
            {msg}
          </p>
        ))}
      </div>
    </div>
  )
}

// ─── State machine ────────────────────────────────────────────────────────────

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "questioning"; data: QuestionResponse }
  | { phase: "answering"; data: QuestionResponse }
  | { phase: "discovering"; tickets: RecommendationTicket[] }
  | { phase: "revealing"; tickets: RecommendationTicket[] }
  | { phase: "revealing"; tickets: RecommendationTicket[] }
  | { phase: "error"; message: string }

type Action =
  | { type: "START" }
  | { type: "SESSION_STARTED"; data: QuestionResponse }
  | { type: "SUBMIT_ANSWER" }
  | { type: "GOT_QUESTION"; data: QuestionResponse }
  | { type: "GOT_RECOMMENDATIONS"; tickets: RecommendationTicket[] }
  | { type: "REVEAL_RECOMMENDATIONS" }
  | { type: "ERROR"; message: string }
  | { type: "RESTART" }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START":
      return { phase: "loading" }
    case "SESSION_STARTED":
      return { phase: "questioning", data: action.data }
    case "SUBMIT_ANSWER":
      if (state.phase !== "questioning") return state
      return { phase: "answering", data: state.data }
    case "GOT_QUESTION":
      return { phase: "questioning", data: action.data }
    case "GOT_RECOMMENDATIONS":
      return { phase: "discovering", tickets: action.tickets }
    case "REVEAL_RECOMMENDATIONS":
      if (state.phase !== "discovering") return state
      return { phase: "revealing", tickets: state.tickets }
    case "ERROR":
      return { phase: "error", message: action.message }
    case "RESTART":
      return { phase: "idle" }
    default:
      return state
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

function Recommend() {
  const [state, dispatch] = useReducer(reducer, { phase: "idle" })
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const [selectedTicket, setSelectedTicket] =
    useState<RecommendationTicket | null>(null)

  // ─── User metadata queries ────────────────────────────────────────────────

  const watchlistQuery = useQuery({
    queryKey: ["movies", "watchlist"],
    queryFn: () => MovieDomainService.listWatchlist({ skip: 0, limit: 200 }),
  })
  const watchedQuery = useQuery({
    queryKey: ["movies", "watched"],
    queryFn: () => MovieDomainService.listWatched({ skip: 0, limit: 200 }),
  })
  const collectionsQuery = useQuery({
    queryKey: ["collections"],
    queryFn: () => MovieDomainService.listNamedCollections(),
  })

  const watchlistByTmdbId = useMemo(() => {
    const result = new Map<number, string>()
    for (const item of watchlistQuery.data?.data ?? []) {
      const tmdbId = item.movie?.tmdb_id
      if (typeof tmdbId === "number") result.set(tmdbId, item.id)
    }
    return result
  }, [watchlistQuery.data])

  const watchedByTmdbId = useMemo(() => {
    const result = new Map<number, string>()
    for (const item of watchedQuery.data?.data ?? []) {
      const tmdbId = item.movie?.tmdb_id
      if (typeof tmdbId === "number") result.set(tmdbId, item.id)
    }
    return result
  }, [watchedQuery.data])

  // ─── Mutations ────────────────────────────────────────────────────────────

  const [actionTmdbId, setActionTmdbId] = useState<number | null>(null)

  const addToWatchlistMutation = useMutation({
    mutationFn: (payload: { tmdbId: number; mediaType: "movie" | "series" }) =>
      MovieDomainService.addToWatchlist({
        tmdb_id: payload.tmdbId,
        media_type: payload.mediaType,
      }),
    onSuccess: () => showSuccessToast("Added to watchlist"),
    onError: () => showErrorToast("Failed to add to watchlist"),
    onSettled: async () => {
      setActionTmdbId(null)
      await queryClient.invalidateQueries({ queryKey: ["movies", "watchlist"] })
    },
  })

  const addToCollectionMutation = useMutation({
    mutationFn: (payload: {
      collectionId: string
      tmdbId: number
      mediaType: "movie" | "series"
    }) =>
      MovieDomainService.addToNamedCollection({
        collectionId: payload.collectionId,
        tmdb_id: payload.tmdbId,
        media_type: payload.mediaType,
      }),
    onSuccess: () => showSuccessToast("Added to collection"),
    onError: () => showErrorToast("Failed to add to collection"),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["collections"] })
    },
  })

  const handleAddToWatchlist = (
    tmdbId: number,
    mediaType: "movie" | "series",
  ) => {
    setActionTmdbId(tmdbId)
    addToWatchlistMutation.mutate({ tmdbId, mediaType })
  }

  const handleAddToCollection = (
    collectionId: string,
    tmdbId: number,
    mediaType: "movie" | "series",
  ) => {
    addToCollectionMutation.mutate({ collectionId, tmdbId, mediaType })
  }

  const userCollections = collectionsQuery.data?.data ?? []

  async function handleStart() {
    dispatch({ type: "START" })
    try {
      const data = await RecommendationsService.startSession()
      dispatch({ type: "SESSION_STARTED", data })
    } catch {
      showErrorToast("Could not start session. Is the server running?")
      dispatch({ type: "RESTART" })
    }
  }

  async function handleAnswer(answer: string) {
    if (state.phase !== "questioning") return
    const { session_id, history_token } = state.data
    dispatch({ type: "SUBMIT_ANSWER" })

    try {
      const res = await RecommendationsService.submitAnswer({
        sessionId: session_id,
        answer,
        historyToken: history_token,
      })
      if (res.phase === "complete") {
        dispatch({ type: "GOT_RECOMMENDATIONS", tickets: res.recommendations })
        setTimeout(() => {
          dispatch({ type: "REVEAL_RECOMMENDATIONS" } as any)
        }, 3000)
      } else {
        dispatch({ type: "GOT_QUESTION", data: res })
      }
    } catch {
      showErrorToast("Something went wrong. Please try again.")
      dispatch({ type: "ERROR", message: "Failed to submit answer." })
    }
  }

  const isWizardActive =
    state.phase === "questioning" || state.phase === "answering"

  return (
    <div
      className={`flex flex-col py-8 ${isWizardActive ? "min-h-[calc(100vh-14rem)] justify-center overflow-hidden" : "min-h-screen"}`}
    >
      {state.phase === "idle" && (
        <WelcomeScreen onStart={handleStart} isLoading={false} />
      )}

      {state.phase === "loading" && (
        <WelcomeScreen onStart={handleStart} isLoading={true} />
      )}

      {isWizardActive && (
        // key resets WizardCard local state (selected chip, text) on each new question
        <WizardCard
          key={state.data.step}
          question={state.data}
          onAnswer={handleAnswer}
          isSubmitting={state.phase === "answering"}
        />
      )}

      {state.phase === "discovering" && <DiscoveringLoader />}

      {state.phase === "revealing" && (
        <TicketReveal
          tickets={state.tickets}
          onRestart={() => dispatch({ type: "RESTART" })}
          watchlistByTmdbId={watchlistByTmdbId}
          watchedByTmdbId={watchedByTmdbId}
          collections={userCollections}
          onAddToWatchlist={handleAddToWatchlist}
          onAddToCollection={handleAddToCollection}
          isActionLoading={
            addToWatchlistMutation.isPending ||
            addToCollectionMutation.isPending
          }
          actionTmdbId={actionTmdbId}
          onSelectTicket={setSelectedTicket}
        />
      )}

      {state.phase === "error" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <p className="text-muted-foreground">{state.message}</p>
          <button
            type="button"
            onClick={() => dispatch({ type: "RESTART" })}
            className="text-sm underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      <MediaDetailDialog
        open={selectedTicket !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTicket(null)
        }}
        item={
          selectedTicket
            ? ({
                collection_item: {
                  media: {
                    tmdb_id: selectedTicket.tmdb_id,
                    media_type: selectedTicket.media_type,
                    title: selectedTicket.title,
                    poster_path: selectedTicket.poster_path,
                    overview: selectedTicket.reason, // Pass reason into overview as fallback
                  },
                },
              } as unknown as FeedItemPublic)
            : null
        }
      />
    </div>
  )
}

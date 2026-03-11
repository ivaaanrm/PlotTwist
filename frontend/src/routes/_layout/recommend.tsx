import { createFileRoute } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { useReducer } from "react"
import { TicketReveal } from "@/components/recommendations/TicketReveal"
import { WelcomeScreen } from "@/components/recommendations/WelcomeScreen"
import { WizardCard } from "@/components/recommendations/WizardCard"
import {
  type QuestionResponse,
  type RecommendationTicket,
  RecommendationsService,
} from "@/features/recommendations/api"
import useCustomToast from "@/hooks/useCustomToast"

export const Route = createFileRoute("/_layout/recommend")({
  component: Recommend,
  head: () => ({
    meta: [{ title: "For You - PlotTwist" }],
  }),
})

// ─── State machine ────────────────────────────────────────────────────────────

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "questioning"; data: QuestionResponse }
  | { phase: "answering"; data: QuestionResponse }
  | { phase: "discovering" }
  | { phase: "revealing"; tickets: RecommendationTicket[] }
  | { phase: "error"; message: string }

type Action =
  | { type: "START" }
  | { type: "SESSION_STARTED"; data: QuestionResponse }
  | { type: "SUBMIT_ANSWER" }
  | { type: "GOT_QUESTION"; data: QuestionResponse }
  | { type: "GOT_RECOMMENDATIONS"; tickets: RecommendationTicket[] }
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
      return { phase: "revealing", tickets: action.tickets }
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
  const { showErrorToast } = useCustomToast()

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
      } else {
        dispatch({ type: "GOT_QUESTION", data: res })
      }
    } catch {
      showErrorToast("Something went wrong. Please try again.")
      dispatch({ type: "ERROR", message: "Failed to submit answer." })
    }
  }

  return (
    <div className="flex flex-col min-h-screen py-8">
      {state.phase === "idle" && (
        <WelcomeScreen onStart={handleStart} isLoading={false} />
      )}

      {state.phase === "loading" && (
        <WelcomeScreen onStart={handleStart} isLoading={true} />
      )}

      {(state.phase === "questioning" || state.phase === "answering") && (
        // key resets WizardCard local state (selected chip, text) on each new question
        <WizardCard
          key={state.data.step}
          question={state.data}
          onAnswer={handleAnswer}
          isSubmitting={state.phase === "answering"}
        />
      )}

      {state.phase === "discovering" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">
            Finding the perfect picks for you…
          </p>
        </div>
      )}

      {state.phase === "revealing" && (
        <TicketReveal
          tickets={state.tickets}
          onRestart={() => dispatch({ type: "RESTART" })}
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
    </div>
  )
}

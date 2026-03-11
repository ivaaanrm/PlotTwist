import { type CancelablePromise, OpenAPI } from "@/client"
import { request as __request } from "@/client/core/request"

export type QuestionResponse = {
  session_id: string
  phase: "questioning"
  step: number
  total_steps: number
  question: string
  options: string[] | null
  history_token: string
}

export type RecommendationTicket = {
  tmdb_id: number
  media_type: "movie" | "series"
  title: string
  year: number | null
  runtime_minutes: number | null
  poster_path: string | null
  genres: string[]
  tmdb_rating: number | null
  reason: string
}

export type RecommendationsResponse = {
  session_id: string
  phase: "complete"
  recommendations: RecommendationTicket[]
}

export type AnswerResponse = QuestionResponse | RecommendationsResponse

export const RecommendationsService = {
  startSession(): CancelablePromise<QuestionResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/recommendations/sessions",
      errors: {
        401: "Unauthorized",
        422: "Validation Error",
      },
    })
  },

  submitAnswer(data: {
    sessionId: string
    answer: string
    historyToken: string
  }): CancelablePromise<AnswerResponse> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/recommendations/sessions/{session_id}/answer",
      path: { session_id: data.sessionId },
      body: { answer: data.answer, history_token: data.historyToken },
      mediaType: "application/json",
      errors: {
        401: "Unauthorized",
        422: "Validation Error",
      },
    })
  },
}

export function getPosterUrl(posterPath: string | null): string | null {
  if (!posterPath) return null
  return `https://image.tmdb.org/t/p/w342${posterPath}`
}

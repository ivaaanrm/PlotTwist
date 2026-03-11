import { ArrowRight, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { QuestionResponse } from "@/features/recommendations/api"
import { AnswerChips } from "./AnswerChips"

type Props = {
  question: QuestionResponse
  onAnswer: (answer: string) => void
  isSubmitting: boolean
}

export function WizardCard({ question, onAnswer, isSubmitting }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [freeText, setFreeText] = useState("")

  const progress = (question.step / question.total_steps) * 100

  const handleChipSelect = (option: string) => {
    setSelected(option)
    setFreeText("")
    onAnswer(option)
  }

  const handleSubmitText = () => {
    const text = freeText.trim()
    if (text) onAnswer(text)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto px-4">
      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Question {question.step}</span>
          <span>
            {question.step} of {question.total_steps}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="relative rounded-2xl border bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">
        {/* Thinking overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-6 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground tracking-tight">
                Thinking…
              </p>
            </div>
          </div>
        )}

        <p className="text-lg font-semibold leading-snug">
          {question.question}
        </p>

        {question.options ? (
          <AnswerChips
            options={question.options}
            selected={selected}
            onSelect={handleChipSelect}
            disabled={isSubmitting}
          />
        ) : null}

        {/* Free text input — always shown as fallback */}
        <div className="flex gap-2">
          <Input
            placeholder={
              question.options ? "Or type your own…" : "Type your answer…"
            }
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmitText()}
            disabled={isSubmitting}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSubmitText}
            disabled={!freeText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

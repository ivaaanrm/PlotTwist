import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Check } from "lucide-react"
import { useState } from "react"

import { UsersService } from "@/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingButton } from "@/components/ui/loading-button"
import { UserAvatar } from "@/components/ui/user-avatar"
import { AVATARS } from "@/lib/avatars"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import { cn } from "@/lib/utils"

interface AvatarPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentAvatarId?: string | null
}

export function AvatarPickerDialog({
  open,
  onOpenChange,
  currentAvatarId,
}: AvatarPickerDialogProps) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [selected, setSelected] = useState<string | null>(
    currentAvatarId ?? null,
  )

  const mutation = useMutation({
    mutationFn: (avatarId: string | null) =>
      UsersService.updateUserMe({ requestBody: { avatar: avatarId } }),
    onSuccess: () => {
      showSuccessToast("Avatar updated")
      queryClient.invalidateQueries({ queryKey: ["currentUser"] })
      onOpenChange(false)
    },
    onError: handleError.bind(showErrorToast),
  })

  const handleSave = () => {
    mutation.mutate(selected)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Choose your avatar</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-3 py-2">
          {AVATARS.map((def) => {
            const isSelected = selected === def.id
            return (
              <button
                key={def.id}
                type="button"
                onClick={() => setSelected(def.id)}
                className={cn(
                  "relative rounded-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isSelected && "ring-2 ring-primary ring-offset-2",
                )}
                title={def.label}
              >
                <UserAvatar
                  avatarId={def.id}
                  displayName={def.label}
                  className="size-12 w-full"
                  iconSizeClass="size-5"
                />
                {isSelected && (
                  <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-2.5" />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <LoadingButton
            loading={mutation.isPending}
            onClick={handleSave}
            disabled={selected === currentAvatarId}
          >
            Save
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

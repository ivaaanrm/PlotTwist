import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bell, Check, Layers, X } from "lucide-react"
import { useState } from "react"

import { UserAvatar } from "@/components/ui/user-avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoadingButton } from "@/components/ui/loading-button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  type CollectionInvitationPublic,
  MovieDomainService,
} from "@/features/movie-domain/api"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"

function RequestCard({
  displayName,
  email,
  followId,
  isResponding,
  onRespond,
}: {
  displayName: string
  email: string
  followId: string
  isResponding: boolean
  onRespond: (followId: string, status: "accepted" | "declined") => void
}) {
  return (
    <article className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-all duration-200">
      <UserAvatar
        displayName={displayName}
        className="size-9 shrink-0"
        iconSizeClass="size-4"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{displayName}</p>
        <p className="text-[11px] text-muted-foreground truncate">{email}</p>
      </div>

      <div className="flex gap-1.5 shrink-0">
        <LoadingButton
          size="sm"
          loading={isResponding}
          onClick={() => onRespond(followId, "accepted")}
          className="rounded-full text-[11px] h-7 px-2.5"
        >
          <Check className="size-3" />
        </LoadingButton>
        <Button
          variant="outline"
          size="sm"
          disabled={isResponding}
          onClick={() => onRespond(followId, "declined")}
          className="rounded-full text-[11px] h-7 px-2.5"
        >
          <X className="size-3" />
        </Button>
      </div>
    </article>
  )
}

function InvitationCard({
  invitation,
  isResponding,
  onRespond,
}: {
  invitation: CollectionInvitationPublic
  isResponding: boolean
  onRespond: (invitationId: string, status: "accepted" | "declined") => void
}) {
  return (
    <article className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-all duration-200">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
        <Layers className="size-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">
          {invitation.collection_name}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">
          Invited by {invitation.sender_full_name || "a collaborator"}
        </p>
      </div>

      <div className="flex gap-1.5 shrink-0">
        <LoadingButton
          size="sm"
          loading={isResponding}
          onClick={() => onRespond(invitation.id, "accepted")}
          className="rounded-full text-[11px] h-7 px-2.5"
        >
          <Check className="size-3" />
        </LoadingButton>
        <Button
          variant="outline"
          size="sm"
          disabled={isResponding}
          onClick={() => onRespond(invitation.id, "declined")}
          className="rounded-full text-[11px] h-7 px-2.5"
        >
          <X className="size-3" />
        </Button>
      </div>
    </article>
  )
}

function SearchSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5"
        >
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-40" />
          </div>
          <Skeleton className="h-7 w-16 xl:w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function NotificationsMenu() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const [respondingFollowId, setRespondingFollowId] = useState<string | null>(
    null,
  )
  const [respondingInvitationId, setRespondingInvitationId] = useState<
    string | null
  >(null)

  const requestsQuery = useQuery({
    queryKey: ["social", "requests"],
    queryFn: () =>
      MovieDomainService.listFollowRequests({ skip: 0, limit: 100 }),
    enabled: Boolean(currentUser?.id),
  })

  const invitationsQuery = useQuery({
    queryKey: ["collections", "invitations"],
    queryFn: () => MovieDomainService.listReceivedInvitations(),
    enabled: Boolean(currentUser?.id),
  })

  const respondToRequestMutation = useMutation({
    mutationFn: (payload: {
      followId: string
      status: "accepted" | "declined"
    }) =>
      MovieDomainService.respondToFollowRequest({
        followId: payload.followId,
        status: payload.status,
      }),
    onSuccess: (_, payload) => {
      showSuccessToast(
        payload.status === "accepted"
          ? "Follow request accepted"
          : "Follow request declined",
      )
    },
    onError: handleError.bind(showErrorToast),
    onSettled: async () => {
      setRespondingFollowId(null)
      await queryClient.invalidateQueries({ queryKey: ["social", "requests"] })
      await queryClient.invalidateQueries({ queryKey: ["social", "following"] })
      await queryClient.invalidateQueries({
        queryKey: ["profile", "followers"],
      })
      await queryClient.invalidateQueries({
        queryKey: ["profile", "following"],
      })
    },
  })

  const respondToInvitationMutation = useMutation({
    mutationFn: (payload: {
      invitationId: string
      status: "accepted" | "declined"
    }) =>
      MovieDomainService.respondToCollectionInvitation({
        invitationId: payload.invitationId,
        status: payload.status,
      }),
    onSuccess: (_, payload) => {
      showSuccessToast(
        payload.status === "accepted"
          ? "Invitation accepted"
          : "Invitation declined",
      )
    },
    onError: handleError.bind(showErrorToast),
    onSettled: async () => {
      setRespondingInvitationId(null)
      await queryClient.invalidateQueries({
        queryKey: ["collections", "invitations"],
      })
      await queryClient.invalidateQueries({ queryKey: ["collections"] })
    },
  })

  if (!currentUser) {
    return null
  }

  const handleRespond = (followId: string, status: "accepted" | "declined") => {
    setRespondingFollowId(followId)
    respondToRequestMutation.mutate({ followId, status })
  }

  const handleInvitationRespond = (
    invitationId: string,
    status: "accepted" | "declined",
  ) => {
    setRespondingInvitationId(invitationId)
    respondToInvitationMutation.mutate({ invitationId, status })
  }

  const requests = requestsQuery.data?.data ?? []
  const invitations = invitationsQuery.data?.data ?? []
  const totalCount = requests.length + invitations.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="size-5 text-muted-foreground" />
          {totalCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-destructive" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[300px] sm:w-[360px] p-4 rounded-2xl mx-2 shadow-xl shadow-black/5 dark:shadow-black/20 border border-primary/10"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold tracking-tight text-sm">
              Notifications
            </h4>
            {totalCount > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                {totalCount} new
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {requestsQuery.isLoading && invitationsQuery.isLoading ? (
              <SearchSkeleton />
            ) : requestsQuery.isError && invitationsQuery.isError ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                Could not load notifications.
              </div>
            ) : totalCount === 0 ? (
              <div className="rounded-xl border border-dashed bg-card/50 px-4 py-8 text-center">
                <p className="text-xs text-muted-foreground">
                  You have no pending notifications.
                </p>
              </div>
            ) : (
              <>
                {invitations.map((invitation) => (
                  <InvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    isResponding={
                      respondToInvitationMutation.isPending &&
                      respondingInvitationId === invitation.id
                    }
                    onRespond={handleInvitationRespond}
                  />
                ))}
                {requests.map((request) => {
                  const displayName =
                    request.requester.full_name || request.requester.username

                  return (
                    <RequestCard
                      key={request.follow.id}
                      displayName={displayName}
                      email={request.requester.username}
                      followId={request.follow.id}
                      isResponding={
                        respondToRequestMutation.isPending &&
                        respondingFollowId === request.follow.id
                      }
                      onRespond={handleRespond}
                    />
                  )
                })}
              </>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

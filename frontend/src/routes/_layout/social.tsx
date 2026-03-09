import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Check, Search, UserPlus } from "lucide-react"
import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MovieDomainService,
  type UserPublic,
} from "@/features/movie-domain/api"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { useDebounce } from "@/hooks/useDebounce"
import { getInitials, handleError } from "@/utils"

export const Route = createFileRoute("/_layout/social")({
  component: Social,
  head: () => ({
    meta: [
      {
        title: "Social - PlotTwist",
      },
    ],
  }),
})

function UserCard({
  user,
  isFollowing,
  isRequested,
  isSendingRequest,
  onFollow,
}: {
  user: UserPublic
  isFollowing: boolean
  isRequested: boolean
  isSendingRequest: boolean
  onFollow: (userId: string) => void
}) {
  const displayName = user.full_name || user.email

  return (
    <article className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-primary/20">
      <Avatar className="size-9 shrink-0">
        <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{displayName}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {user.email}
        </p>
      </div>

      {isFollowing ? (
        <Button
          variant="secondary"
          size="sm"
          disabled
          className="rounded-full text-[11px] h-7 px-2.5 shrink-0"
        >
          <Check className="size-3" />
          Following
        </Button>
      ) : isRequested ? (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="rounded-full text-[11px] h-7 px-2.5 shrink-0"
        >
          Requested
        </Button>
      ) : (
        <LoadingButton
          size="sm"
          loading={isSendingRequest}
          disabled={isSendingRequest}
          onClick={() => onFollow(user.id)}
          className="rounded-full text-[11px] h-7 px-2.5 shrink-0"
        >
          <UserPlus className="size-3" />
          Follow
        </LoadingButton>
      )}
    </article>
  )
}

function SearchSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5"
        >
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-40" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

function Social() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const [searchInput, setSearchInput] = useState("")
  const debouncedQuery = useDebounce(searchInput.trim(), 400)

  const [sendingUserId, setSendingUserId] = useState<string | null>(null)
  const [requestedUserIds, setRequestedUserIds] = useState<Set<string>>(
    new Set(),
  )

  // Note: users are only fetched when there is a search query
  const usersQuery = useQuery({
    queryKey: ["social", "users", debouncedQuery],
    queryFn: () =>
      MovieDomainService.searchUsers({
        query: debouncedQuery,
        skip: 0,
        limit: 50,
      }),
    enabled: Boolean(currentUser?.id) && debouncedQuery.length > 0,
  })

  const followingQuery = useQuery({
    queryKey: ["social", "following"],
    queryFn: () => MovieDomainService.listFollowing({ skip: 0, limit: 200 }),
    enabled: Boolean(currentUser?.id),
  })

  // We still use data from followingQuery to determine isFollowing state locally
  const followingUserIds = new Set(
    (followingQuery.data?.data ?? []).map((item) => item.following_id),
  )

  const sendFollowRequestMutation = useMutation({
    mutationFn: (userId: string) =>
      MovieDomainService.sendFollowRequest({ userId }),
    onSuccess: (_, userId) => {
      setRequestedUserIds((previous) => {
        const next = new Set(previous)
        next.add(userId)
        return next
      })
      showSuccessToast("Follow request sent")
    },
    onError: handleError.bind(showErrorToast),
    onSettled: async () => {
      setSendingUserId(null)
      await queryClient.invalidateQueries({ queryKey: ["social", "following"] })
      await queryClient.invalidateQueries({
        queryKey: ["profile", "followers"],
      })
      await queryClient.invalidateQueries({
        queryKey: ["profile", "following"],
      })
    },
  })

  if (!currentUser) return null

  const handleFollow = (userId: string) => {
    setSendingUserId(userId)
    sendFollowRequestMutation.mutate(userId)
  }

  const users = usersQuery.data?.data ?? []

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Find Users
        </h1>
        <p className="text-muted-foreground text-sm">
          Search for users to follow and connect with.
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            aria-label="Search users"
            className="rounded-xl pl-9"
          />
        </div>

        {usersQuery.isLoading && debouncedQuery && <SearchSkeleton />}

        {usersQuery.isError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {usersQuery.error.message || "Could not load users."}
          </div>
        )}

        {!debouncedQuery && (
          <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center">
            <Search className="size-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              Start typing to search users
            </p>
          </div>
        )}

        {!usersQuery.isLoading &&
          !usersQuery.isError &&
          debouncedQuery &&
          users.length === 0 && (
            <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No users found for "{debouncedQuery}". Try another search term.
              </p>
            </div>
          )}

        {!usersQuery.isLoading && !usersQuery.isError && users.length > 0 && (
          <div className="space-y-2">
            {users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                isFollowing={followingUserIds.has(user.id)}
                isRequested={requestedUserIds.has(user.id)}
                isSendingRequest={
                  sendFollowRequestMutation.isPending &&
                  sendingUserId === user.id
                }
                onFollow={handleFollow}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

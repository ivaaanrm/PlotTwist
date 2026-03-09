import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Check, Search, UserPlus, X } from "lucide-react"
import { type FormEvent, useMemo, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MovieDomainService,
  type UserPublic,
} from "@/features/movie-domain/api"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
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
    <article className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-primary/20">
      <Avatar className="size-9 shrink-0">
        <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>
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
          Accept
        </LoadingButton>
        <Button
          variant="outline"
          size="sm"
          disabled={isResponding}
          onClick={() => onRespond(followId, "declined")}
          className="rounded-full text-[11px] h-7 px-2"
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
  const [query, setQuery] = useState("")
  const [sendingUserId, setSendingUserId] = useState<string | null>(null)
  const [respondingFollowId, setRespondingFollowId] = useState<string | null>(
    null,
  )
  const [requestedUserIds, setRequestedUserIds] = useState<Set<string>>(
    new Set(),
  )

  const usersQuery = useQuery({
    queryKey: ["social", "users", query],
    queryFn: () =>
      MovieDomainService.searchUsers({ query, skip: 0, limit: 50 }),
    enabled: Boolean(currentUser?.id),
  })

  const followingQuery = useQuery({
    queryKey: ["social", "following"],
    queryFn: () => MovieDomainService.listFollowing({ skip: 0, limit: 200 }),
    enabled: Boolean(currentUser?.id),
  })

  const requestsQuery = useQuery({
    queryKey: ["social", "requests"],
    queryFn: () =>
      MovieDomainService.listFollowRequests({ skip: 0, limit: 100 }),
    enabled: Boolean(currentUser?.id),
  })

  const followingUserIds = useMemo(() => {
    return new Set(
      (followingQuery.data?.data ?? []).map((item) => item.following_id),
    )
  }, [followingQuery.data])

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

  if (!currentUser) {
    return null
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setQuery(searchInput.trim())
  }

  const handleFollow = (userId: string) => {
    setSendingUserId(userId)
    sendFollowRequestMutation.mutate(userId)
  }

  const handleRespond = (
    followId: string,
    status: "accepted" | "declined",
  ) => {
    setRespondingFollowId(followId)
    respondToRequestMutation.mutate({ followId, status })
  }

  const users = usersQuery.data?.data ?? []
  const requests = requestsQuery.data?.data ?? []

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Social
        </h1>
        <p className="text-muted-foreground text-sm">
          Find users to follow and manage follow requests.
        </p>
      </div>

      <Tabs defaultValue="search" className="gap-3">
        <TabsList>
          <TabsTrigger value="search">Find users</TabsTrigger>
          <TabsTrigger value="requests">
            Requests ({requestsQuery.data?.count ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-3">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search by name or email"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              aria-label="Search users"
              className="rounded-xl"
            />
            <Button type="submit" className="rounded-xl">
              <Search className="size-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </form>

          {usersQuery.isLoading && <SearchSkeleton />}

          {usersQuery.isError && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {usersQuery.error.message || "Could not load users."}
            </div>
          )}

          {!usersQuery.isLoading &&
            !usersQuery.isError &&
            users.length === 0 && (
              <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No users found. Try another search term.
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
        </TabsContent>

        <TabsContent value="requests" className="space-y-2">
          {requestsQuery.isLoading && <SearchSkeleton />}

          {requestsQuery.isError && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {requestsQuery.error.message ||
                "Could not load follow requests."}
            </div>
          )}

          {!requestsQuery.isLoading &&
            !requestsQuery.isError &&
            requests.length === 0 && (
              <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  You have no pending follow requests.
                </p>
              </div>
            )}

          {!requestsQuery.isLoading &&
            !requestsQuery.isError &&
            requests.length > 0 && (
              <div className="space-y-2">
                {requests.map((request) => {
                  const displayName =
                    request.requester.full_name || request.requester.email

                  return (
                    <RequestCard
                      key={request.follow.id}
                      displayName={displayName}
                      email={request.requester.email}
                      followId={request.follow.id}
                      isResponding={
                        respondToRequestMutation.isPending &&
                        respondingFollowId === request.follow.id
                      }
                      onRespond={handleRespond}
                    />
                  )
                })}
              </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

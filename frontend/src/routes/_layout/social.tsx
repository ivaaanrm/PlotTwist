import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Calendar, Check, Search, UserPlus, X } from "lucide-react"
import { type FormEvent, useMemo, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { handleError } from "@/utils"

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

function getInitials(nameOrEmail: string) {
  return nameOrEmail
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Unknown date"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown date"
  }

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function UserSearchCard({
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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="size-10">
              <AvatarFallback className="bg-zinc-600 text-white">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium truncate">{displayName}</p>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>

          {isFollowing ? (
            <Button variant="secondary" disabled>
              <Check className="size-4" />
              Following
            </Button>
          ) : isRequested ? (
            <Button variant="outline" disabled>
              Requested
            </Button>
          ) : (
            <LoadingButton
              loading={isSendingRequest}
              disabled={isSendingRequest}
              onClick={() => onFollow(user.id)}
            >
              <UserPlus className="size-4" />
              Follow
            </LoadingButton>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SearchSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>
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

  const handleRespond = (followId: string, status: "accepted" | "declined") => {
    setRespondingFollowId(followId)
    respondToRequestMutation.mutate({ followId, status })
  }

  const users = usersQuery.data?.data ?? []
  const requests = requestsQuery.data?.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Social</h1>
        <p className="text-muted-foreground">
          Find users to follow and manage your incoming follow requests.
        </p>
      </div>

      <Tabs defaultValue="search" className="gap-4">
        <TabsList>
          <TabsTrigger value="search">Find users</TabsTrigger>
          <TabsTrigger value="requests">
            Requests ({requestsQuery.data?.count ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search by name or email"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              aria-label="Search users"
            />
            <Button type="submit">
              <Search className="size-4" />
              Search
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
              <div className="rounded-xl border bg-card p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No users found. Try another search term.
                </p>
              </div>
            )}

          {!usersQuery.isLoading && !usersQuery.isError && users.length > 0 && (
            <div className="space-y-3">
              {users.map((user) => (
                <UserSearchCard
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

        <TabsContent value="requests" className="space-y-3">
          {requestsQuery.isLoading && <SearchSkeleton />}

          {requestsQuery.isError && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {requestsQuery.error.message || "Could not load follow requests."}
            </div>
          )}

          {!requestsQuery.isLoading &&
            !requestsQuery.isError &&
            requests.length === 0 && (
              <div className="rounded-xl border bg-card p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  You have no pending follow requests.
                </p>
              </div>
            )}

          {!requestsQuery.isLoading &&
            !requestsQuery.isError &&
            requests.length > 0 && (
              <div className="space-y-3">
                {requests.map((request) => {
                  const displayName =
                    request.requester.full_name || request.requester.email

                  return (
                    <Card key={request.follow.id}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {displayName}
                        </CardTitle>
                        <CardDescription>
                          {request.requester.email}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Badge variant="outline" className="gap-1">
                          <Calendar className="size-3.5" />
                          Requested {formatDate(request.follow.created_at)}
                        </Badge>

                        <div className="flex gap-2">
                          <LoadingButton
                            loading={
                              respondToRequestMutation.isPending &&
                              respondingFollowId === request.follow.id
                            }
                            onClick={() =>
                              handleRespond(request.follow.id, "accepted")
                            }
                          >
                            <Check className="size-4" />
                            Accept
                          </LoadingButton>

                          <Button
                            variant="destructive"
                            disabled={
                              respondToRequestMutation.isPending &&
                              respondingFollowId === request.follow.id
                            }
                            onClick={() =>
                              handleRespond(request.follow.id, "declined")
                            }
                          >
                            <X className="size-4" />
                            Decline
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

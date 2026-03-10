import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowLeft,
  GripVertical,
  Layers,
  Search,
  Star,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react"
import { useState } from "react"

import { MediaDetailDialog } from "@/components/Common/MediaDetailDialog"
import { MoviePoster } from "@/components/Common/MoviePoster"
import { UserAvatar } from "@/components/ui/user-avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  type CollectionDetailPublic,
  type CollectionItemPublicNamed,
  type CollectionMemberPublic,
  MovieDomainService,
} from "@/features/movie-domain/api"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { useDebounce } from "@/hooks/useDebounce"
import { handleError } from "@/utils"
import { formatTmdbRating } from "@/lib/media"

export const Route = createFileRoute("/_layout/collections/$collectionId")({
  component: CollectionDetail,
  head: () => ({
    meta: [{ title: "Collection - PlotTwist" }],
  }),
})

// --- Sortable poster item ---

function SortablePosterItem({
  item,
  onRemove,
  isRemoving,
  onSelect,
}: {
  item: CollectionItemPublicNamed
  onRemove: (itemId: string) => void
  isRemoving: boolean
  onSelect: (item: CollectionItemPublicNamed) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  }

  const tmdbRating = formatTmdbRating(item.media?.tmdb_rating)

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <div
        className="relative aspect-[2/3] rounded-lg overflow-hidden border bg-muted/30 cursor-pointer"
        onClick={() => onSelect(item)}
      >
        <MoviePoster
          posterPath={item.media?.poster_path}
          title={item.media?.title ?? ""}
        />
        {tmdbRating && (
          <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-medium flex items-center gap-1 shadow-sm z-10 pointer-events-none text-amber-500">
            <Star className="size-2.5 fill-amber-500 text-amber-500" />
            <span className="text-white">{tmdbRating}</span>
          </div>
        )}
      </div>

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-3.5" />
      </button>

      {/* Remove button */}
      <button
        onClick={() => onRemove(item.id)}
        disabled={isRemoving}
        className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
        aria-label="Remove from collection"
      >
        <X className="size-3.5" />
      </button>

      {/* Title */}
      <p className="text-[11px] font-medium mt-1.5 line-clamp-2 leading-tight">
        {item.media?.title ?? "Untitled"}
      </p>
    </div>
  )
}

// --- Invite dialog ---

function InviteDialog({
  open,
  onOpenChange,
  collectionId,
  members,
  isOwner,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  collectionId: string
  members: CollectionMemberPublic[]
  isOwner: boolean
}) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const [searchInput, setSearchInput] = useState("")
  const debouncedQuery = useDebounce(searchInput.trim(), 400)

  const usersQuery = useQuery({
    queryKey: ["social", "users", debouncedQuery],
    queryFn: () =>
      MovieDomainService.searchUsers({
        query: debouncedQuery,
        skip: 0,
        limit: 20,
      }),
    enabled: debouncedQuery.length > 0,
  })

  const inviteMutation = useMutation({
    mutationFn: (receiverId: string) =>
      MovieDomainService.inviteToCollection({
        collectionId,
        receiver_id: receiverId,
      }),
    onSuccess: () => showSuccessToast("Invitation sent"),
    onError: handleError.bind(showErrorToast),
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["collections", collectionId],
      })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) =>
      MovieDomainService.removeCollectionMember({
        collectionId,
        userId,
      }),
    onSuccess: () => showSuccessToast("Member removed"),
    onError: handleError.bind(showErrorToast),
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["collections", collectionId],
      })
    },
  })

  const memberUserIds = new Set(members.map((m) => m.user_id))
  const users = usersQuery.data?.data ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Collaborators</DialogTitle>
          <DialogDescription>
            Invite users to contribute to this collection.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Current members */}
          {members.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Members ({members.length})
              </p>
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2"
                >
                  <UserAvatar
                    displayName={member.user_full_name || member.user_email || "?"}
                    className="size-7"
                    iconSizeClass="size-3"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.user_full_name || member.user_email}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {member.role}
                    </p>
                  </div>
                  {isOwner && member.role !== "owner" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        removeMemberMutation.mutate(member.user_id)
                      }
                      disabled={removeMemberMutation.isPending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Invite search */}
          {isOwner && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Invite
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search users by name or email"
                  className="pl-9"
                />
              </div>
              {users.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {users
                    .filter((u) => !memberUserIds.has(u.id))
                    .map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 rounded-lg border px-3 py-2"
                      >
                        <UserAvatar
                          avatarId={user.avatar}
                          displayName={user.full_name || user.username}
                          className="size-7"
                          iconSizeClass="size-3"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.full_name || user.username}
                          </p>
                        </div>
                        <LoadingButton
                          size="sm"
                          loading={inviteMutation.isPending}
                          onClick={() => inviteMutation.mutate(user.id)}
                          className="rounded-full text-[11px] h-7 px-2.5"
                        >
                          <UserPlus className="size-3" />
                          Invite
                        </LoadingButton>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// --- Detail skeleton ---

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[2/3] rounded-lg" />
            <Skeleton className="h-3 w-3/4 mt-1.5" />
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Main component ---

function CollectionDetail() {
  const { collectionId } = Route.useParams()
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [removingItemId, setRemovingItemId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<CollectionItemPublicNamed | null>(null)

  const collectionQuery = useQuery({
    queryKey: ["collections", collectionId],
    queryFn: () => MovieDomainService.getNamedCollection({ collectionId }),
    enabled: Boolean(collectionId),
  })

  const removeMutation = useMutation({
    mutationFn: (itemId: string) =>
      MovieDomainService.removeFromNamedCollection({
        collectionId,
        itemId,
      }),
    onSuccess: () => showSuccessToast("Removed from collection"),
    onError: handleError.bind(showErrorToast),
    onSettled: async () => {
      setRemovingItemId(null)
      await queryClient.invalidateQueries({
        queryKey: ["collections", collectionId],
      })
      await queryClient.invalidateQueries({ queryKey: ["collections"] })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (itemIds: string[]) =>
      MovieDomainService.reorderNamedCollection({
        collectionId,
        item_ids: itemIds,
      }),
    onError: handleError.bind(showErrorToast),
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  )

  const handleRemove = (itemId: string) => {
    setRemovingItemId(itemId)
    removeMutation.mutate(itemId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const collection = collectionQuery.data
    if (!collection) return

    const items = collection.items
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(items, oldIndex, newIndex)

    // Optimistic update
    queryClient.setQueryData(
      ["collections", collectionId],
      (old: CollectionDetailPublic | undefined) =>
        old ? { ...old, items: reordered } : old,
    )

    reorderMutation.mutate(reordered.map((i) => i.id))
  }

  if (collectionQuery.isLoading) {
    return <DetailSkeleton />
  }

  if (collectionQuery.isError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {collectionQuery.error?.message || "Could not load collection."}
        </div>
      </div>
    )
  }

  const collection = collectionQuery.data
  if (!collection) return null

  const isOwner = collection.owner_id === currentUser?.id
  const items = collection.items

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        to="/collections"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="size-4" />
        Collections
      </Link>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          {collection.name}
        </h1>
        {collection.description && (
          <p className="text-sm text-muted-foreground">
            {collection.description}
          </p>
        )}
      </div>

      {/* Members bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Users className="size-3.5 text-muted-foreground" />
          <div className="flex -space-x-1.5">
            {collection.members.slice(0, 5).map((member) => (
              <UserAvatar
                key={member.id}
                displayName={member.user_full_name || member.user_email || "?"}
                className="size-6 border-2 border-background"
                iconSizeClass="size-2.5"
              />
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {collection.members.length}{" "}
            {collection.members.length === 1 ? "member" : "members"}
          </span>
        </div>

        {isOwner && collection.is_collaborative && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full text-[11px] h-7 px-2.5 gap-1"
            onClick={() => setIsInviteOpen(true)}
          >
            <UserPlus className="size-3" />
            Invite
          </Button>
        )}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50 shadow-sm">
            <Layers className="size-7 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-bold mb-1.5">No movies yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Add movies from the Discover page to start building this collection.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {items.map((item) => (
                <SortablePosterItem
                  key={item.id}
                  item={item}
                  onRemove={handleRemove}
                  isRemoving={
                    removingItemId === item.id && removeMutation.isPending
                  }
                  onSelect={setSelectedItem}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Invite dialog */}
      {isOwner && collection.is_collaborative && (
        <InviteDialog
          open={isInviteOpen}
          onOpenChange={setIsInviteOpen}
          collectionId={collectionId}
          members={collection.members}
          isOwner={isOwner}
        />
      )}

      {/* Media Detail dialog */}
      <MediaDetailDialog
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null)
        }}
        item={selectedItem ? ({ collection_item: selectedItem } as any) : null}
      />
    </div>
  )
}

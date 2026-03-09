import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { EllipsisVertical, Layers, Plus, Trash2, Users } from "lucide-react"
import { useState } from "react"

import { MoviePoster } from "@/components/Common/MoviePoster"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/ui/loading-button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  type CollectionPublic,
  MovieDomainService,
} from "@/features/movie-domain/api"
import useAuth from "@/hooks/useAuth"
import useCustomToast from "@/hooks/useCustomToast"
import { getInitials, handleError } from "@/utils"

export const Route = createFileRoute("/_layout/collections/")({
  component: Collections,
  head: () => ({
    meta: [{ title: "Collections - PlotTwist" }],
  }),
})

function CollectionMosaic({ posters }: { posters: (string | null)[] }) {
  const slots = [0, 1, 2, 3]

  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-[4/3] rounded-t-xl overflow-hidden bg-muted/30">
      {slots.map((i) => (
        <div key={i} className="overflow-hidden">
          {posters[i] ? (
            <MoviePoster
              posterPath={posters[i]}
              title=""
              className="rounded-none"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-muted/50 to-muted/20" />
          )}
        </div>
      ))}
    </div>
  )
}

function CollectionCard({
  collection,
  isOwner,
  onDelete,
  isDeleting,
}: {
  collection: CollectionPublic
  isOwner: boolean
  onDelete: (id: string) => void
  isDeleting: boolean
}) {
  return (
    <div className="group rounded-xl border bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:border-primary/20">
      <Link
        to="/collections/$collectionId"
        params={{ collectionId: collection.id }}
        className="block"
      >
        <CollectionMosaic posters={collection.cover_posters} />
      </Link>

      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            to="/collections/$collectionId"
            params={{ collectionId: collection.id }}
            className="min-w-0"
          >
            <h3 className="font-semibold text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
              {collection.name}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {collection.item_count}{" "}
              {collection.item_count === 1 ? "item" : "items"}
            </p>
          </Link>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-muted-foreground"
                >
                  <EllipsisVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  disabled={isDeleting}
                  onClick={() => onDelete(collection.id)}
                >
                  <Trash2 className="size-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Collaborator avatars */}
        {collection.members.length > 1 && (
          <div className="flex items-center gap-1">
            <Users className="size-3 text-muted-foreground" />
            <div className="flex -space-x-1.5">
              {collection.members.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="size-5 border-2 border-card">
                  <AvatarFallback className="text-[8px] font-semibold bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                    {getInitials(
                      member.user_full_name || member.user_email || "?",
                    )}
                  </AvatarFallback>
                </Avatar>
              ))}
              {collection.members.length > 3 && (
                <span className="text-[10px] text-muted-foreground ml-1.5">
                  +{collection.members.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CreateCollectionDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isCollaborative, setIsCollaborative] = useState(false)

  const createMutation = useMutation({
    mutationFn: () =>
      MovieDomainService.createNamedCollection({
        name,
        description: description || null,
        is_collaborative: isCollaborative,
      }),
    onSuccess: () => {
      showSuccessToast("Collection created")
      setName("")
      setDescription("")
      setIsCollaborative(false)
      onOpenChange(false)
    },
    onError: handleError.bind(showErrorToast),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["collections"] })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Collection</DialogTitle>
          <DialogDescription>
            Create a curated list of movies and series.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="collection-name">Name</Label>
            <Input
              id="collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Best Sci-Fi Films"
              maxLength={255}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="collection-desc">Description (optional)</Label>
            <Textarea
              id="collection-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this collection about?"
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Collaborative</p>
              <p className="text-[11px] text-muted-foreground">
                Allow invited users to add and reorder movies
              </p>
            </div>
            <Switch
              checked={isCollaborative}
              onCheckedChange={setIsCollaborative}
            />
          </div>
          <LoadingButton
            className="w-full"
            loading={createMutation.isPending}
            disabled={!name.trim()}
            onClick={() => createMutation.mutate()}
          >
            Create Collection
          </LoadingButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CollectionsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card overflow-hidden">
          <Skeleton className="aspect-[4/3]" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

function Collections() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const collectionsQuery = useQuery({
    queryKey: ["collections"],
    queryFn: () => MovieDomainService.listNamedCollections(),
    enabled: Boolean(currentUser?.id),
  })

  const deleteMutation = useMutation({
    mutationFn: (collectionId: string) =>
      MovieDomainService.deleteNamedCollection({ collectionId }),
    onSuccess: () => showSuccessToast("Collection deleted"),
    onError: handleError.bind(showErrorToast),
    onSettled: async () => {
      setDeletingId(null)
      await queryClient.invalidateQueries({ queryKey: ["collections"] })
    },
  })

  const handleDelete = (id: string) => {
    setDeletingId(id)
    deleteMutation.mutate(id)
  }

  const collections = collectionsQuery.data?.data ?? []

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Collections
          </h1>
          <p className="text-muted-foreground text-sm">
            Curated lists of movies and series.
          </p>
        </div>
        <Button
          size="sm"
          className="rounded-full gap-1.5"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="size-3.5" />
          New
        </Button>
      </div>

      {/* Content */}
      {collectionsQuery.isLoading && <CollectionsSkeleton />}

      {collectionsQuery.isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {collectionsQuery.error?.message || "Could not load collections."}
        </div>
      )}

      {!collectionsQuery.isLoading && collections.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50 shadow-sm">
            <Layers className="size-7 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-bold mb-1.5">No collections yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed mb-4">
            Create your first collection to start curating movies and series.
          </p>
          <Button
            size="sm"
            className="rounded-full gap-1.5"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="size-3.5" />
            Create Collection
          </Button>
        </div>
      )}

      {!collectionsQuery.isLoading && collections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              isOwner={collection.owner_id === currentUser?.id}
              onDelete={handleDelete}
              isDeleting={
                deletingId === collection.id && deleteMutation.isPending
              }
            />
          ))}
        </div>
      )}

      <CreateCollectionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  )
}

import type { LucideIcon } from "lucide-react"
import {
  Aperture,
  Camera,
  Clapperboard,
  Drama,
  Film,
  Popcorn,
  Star,
  Ticket,
  Tv,
  Video,
} from "lucide-react"

export type AvatarDef = {
  id: string
  label: string
  gradient: string
  icon: LucideIcon
  iconClass: string
}

export const AVATARS: AvatarDef[] = [
  {
    id: "avatar_01",
    label: "Director",
    gradient: "from-violet-500 to-purple-700",
    icon: Clapperboard,
    iconClass: "text-white",
  },
  {
    id: "avatar_02",
    label: "Cinephile",
    gradient: "from-rose-500 to-pink-700",
    icon: Film,
    iconClass: "text-white",
  },
  {
    id: "avatar_03",
    label: "Critic",
    gradient: "from-amber-400 to-orange-600",
    icon: Star,
    iconClass: "text-white",
  },
  {
    id: "avatar_04",
    label: "Binge Watcher",
    gradient: "from-sky-500 to-blue-700",
    icon: Tv,
    iconClass: "text-white",
  },
  {
    id: "avatar_05",
    label: "Movie Buff",
    gradient: "from-red-500 to-rose-700",
    icon: Popcorn,
    iconClass: "text-white",
  },
  {
    id: "avatar_06",
    label: "Photographer",
    gradient: "from-teal-500 to-cyan-700",
    icon: Camera,
    iconClass: "text-white",
  },
  {
    id: "avatar_07",
    label: "Collector",
    gradient: "from-yellow-400 to-amber-600",
    icon: Ticket,
    iconClass: "text-white",
  },
  {
    id: "avatar_08",
    label: "Filmmaker",
    gradient: "from-emerald-500 to-green-700",
    icon: Video,
    iconClass: "text-white",
  },
  {
    id: "avatar_09",
    label: "Shutterbug",
    gradient: "from-indigo-500 to-violet-700",
    icon: Aperture,
    iconClass: "text-white",
  },
  {
    id: "avatar_10",
    label: "Performer",
    gradient: "from-fuchsia-500 to-purple-700",
    icon: Drama,
    iconClass: "text-white",
  },
]

export const AVATAR_MAP: Record<string, AvatarDef> = Object.fromEntries(
  AVATARS.map((a) => [a.id, a]),
)

export function getAvatar(id: string | null | undefined): AvatarDef | undefined {
  if (!id) return undefined
  return AVATAR_MAP[id]
}

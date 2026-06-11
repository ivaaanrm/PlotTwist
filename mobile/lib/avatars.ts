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
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

export type AvatarDef = {
  id: string;
  label: string;
  color: string;
  icon: LucideIcon;
};

export const AVATARS: AvatarDef[] = [
  { id: "avatar_01", label: "Director", color: "#7c3aed", icon: Clapperboard },
  { id: "avatar_02", label: "Cinephile", color: "#e11d48", icon: Film },
  { id: "avatar_03", label: "Critic", color: "#d97706", icon: Star },
  { id: "avatar_04", label: "Binge Watcher", color: "#0284c7", icon: Tv },
  { id: "avatar_05", label: "Movie Buff", color: "#dc2626", icon: Popcorn },
  { id: "avatar_06", label: "Photographer", color: "#0d9488", icon: Camera },
  { id: "avatar_07", label: "Collector", color: "#ca8a04", icon: Ticket },
  { id: "avatar_08", label: "Filmmaker", color: "#059669", icon: Video },
  { id: "avatar_09", label: "Shutterbug", color: "#4f46e5", icon: Aperture },
  { id: "avatar_10", label: "Performer", color: "#a21caf", icon: Drama },
];

const AVATAR_MAP: Record<string, AvatarDef> = Object.fromEntries(
  AVATARS.map((a) => [a.id, a])
);

export function getAvatar(id: string | null | undefined): AvatarDef | undefined {
  if (!id) return undefined;
  return AVATAR_MAP[id];
}

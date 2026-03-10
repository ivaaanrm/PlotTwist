import { cn } from "@/lib/utils"
import { getAvatar } from "@/lib/avatars"
import { getInitials } from "@/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface UserAvatarProps {
  avatarId?: string | null
  displayName: string
  className?: string
  iconSizeClass?: string
  fallbackClassName?: string
}

export function UserAvatar({
  avatarId,
  displayName,
  className,
  iconSizeClass = "size-5",
  fallbackClassName,
}: UserAvatarProps) {
  const def = getAvatar(avatarId)

  return (
    <Avatar className={className}>
      <AvatarFallback
        className={cn(
          def
            ? `bg-gradient-to-br ${def.gradient}`
            : "bg-gradient-to-br from-primary/80 to-primary",
          "text-white",
          fallbackClassName,
        )}
      >
        {def ? (
          <def.icon className={cn(iconSizeClass, def.iconClass)} />
        ) : (
          getInitials(displayName)
        )}
      </AvatarFallback>
    </Avatar>
  )
}

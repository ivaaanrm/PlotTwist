import { Link as RouterLink, useRouterState } from "@tanstack/react-router"
import { Home, Layers, Plus } from "lucide-react"

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Plus, label: "Discover", path: "/discover" },
  { icon: Layers, label: "Collections", path: "/collections" },
]

export function MobileBottomNav() {
  const router = useRouterState()
  const currentPath = router.location.pathname

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t bg-card/80 backdrop-blur-xl md:hidden"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.path
          const isDiscover = item.path === "/discover"

          return (
            <RouterLink
              key={item.path}
              to={item.path}
              className="flex flex-1 flex-col items-center justify-center transition-all duration-200"
            >
              {isDiscover ? (
                <div className="flex p-2 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform hover:scale-105">
                  <item.icon className="size-6" strokeWidth={2.5} />
                </div>
              ) : (
                <div
                  className={`p-2 rounded-full transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <item.icon
                    className={`size-6 transition-transform ${isActive ? "scale-110" : ""}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
              )}
            </RouterLink>
          )
        })}
      </div>

      {/* Safe area padding for devices with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}

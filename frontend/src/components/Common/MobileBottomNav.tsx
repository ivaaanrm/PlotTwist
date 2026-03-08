import {
    Link as RouterLink,
    useRouterState,
} from "@tanstack/react-router"
import { CircleUser, Home, Search, UserRoundPlus } from "lucide-react"

const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Discover", path: "/discover" },
    { icon: UserRoundPlus, label: "Social", path: "/social" },
    { icon: CircleUser, label: "Profile", path: "/profile" },
]

export function MobileBottomNav() {
    const router = useRouterState()
    const currentPath = router.location.pathname

    return (
        <nav
            className="fixed bottom-0 inset-x-0 z-50 border-t bg-card/80 backdrop-blur-xl md:hidden"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto px-2">
                {navItems.map((item) => {
                    const isActive = currentPath === item.path

                    return (
                        <RouterLink
                            key={item.path}
                            to={item.path}
                            className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${isActive
                                    ? "text-primary"
                                    : "text-muted-foreground active:text-foreground"
                                }`}
                        >
                            <item.icon
                                className={`size-5 transition-transform ${isActive ? "scale-110" : ""}`}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span>{item.label}</span>
                        </RouterLink>
                    )
                })}
            </div>

            {/* Safe area padding for devices with home indicator */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
    )
}

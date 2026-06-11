import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router"
import { UserRoundPlus } from "lucide-react"

import { Footer } from "@/components/Common/Footer"
import { Logo } from "@/components/Common/Logo"
import { MobileBottomNav } from "@/components/Common/MobileBottomNav"
import { NotificationsMenu } from "@/components/Common/NotificationsMenu"
import AppSidebar from "@/components/Sidebar/AppSidebar"
import { Button } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { UserAvatar } from "@/components/ui/user-avatar"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout")({
  component: Layout,
  beforeLoad: async () => {
    if (!isLoggedIn()) {
      throw redirect({
        to: "/login",
      })
    }
  },
})

function Layout() {
  const { user: currentUser } = useAuth()

  return (
    <SidebarProvider>
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:contents">
        <AppSidebar />
      </div>
      <SidebarInset>
        {/* Mobile header — visible only on mobile */}
        <header className="lg:hidden sticky top-0 z-50 flex min-h-14 shrink-0 items-center justify-between border-b bg-card/80 backdrop-blur-xl px-4 pt-[env(safe-area-inset-top)]">
          <Logo variant="full" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full"
              asChild
            >
              <Link to="/social">
                <UserRoundPlus className="size-5 text-muted-foreground" />
              </Link>
            </Button>
            <NotificationsMenu />
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full"
              asChild
            >
              <Link to="/profile">
                <UserAvatar
                  avatarId={currentUser?.avatar}
                  displayName={
                    currentUser?.full_name || currentUser?.email || "User"
                  }
                  className="size-7"
                  iconSizeClass="size-3"
                  fallbackClassName="bg-primary/10 text-primary text-xs font-medium"
                />
              </Link>
            </Button>
          </div>
        </header>
        {/* Desktop header with sidebar trigger — hidden on mobile */}
        <header className="hidden lg:flex sticky top-0 z-50 h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1 text-muted-foreground" />
          <div className="ml-auto flex items-center gap-1">
            <NotificationsMenu />
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full"
              asChild
            >
              <Link to="/profile">
                <UserAvatar
                  avatarId={currentUser?.avatar}
                  displayName={
                    currentUser?.full_name || currentUser?.email || "User"
                  }
                  className="size-8"
                  iconSizeClass="size-3.5"
                  fallbackClassName="bg-primary/10 text-primary text-xs font-medium"
                />
              </Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:p-8 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
        <div className="hidden lg:block">
          <Footer />
        </div>
      </SidebarInset>
      {/* Mobile bottom nav — hidden on desktop */}
      <MobileBottomNav />
    </SidebarProvider>
  )
}

export default Layout

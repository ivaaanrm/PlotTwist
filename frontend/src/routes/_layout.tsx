import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { Footer } from "@/components/Common/Footer"
import { Logo } from "@/components/Common/Logo"
import { MobileBottomNav } from "@/components/Common/MobileBottomNav"
import { NotificationsMenu } from "@/components/Common/NotificationsMenu"
import AppSidebar from "@/components/Sidebar/AppSidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { isLoggedIn } from "@/hooks/useAuth"

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
  return (
    <SidebarProvider>
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:contents">
        <AppSidebar />
      </div>
      <SidebarInset>
        {/* Mobile header — visible only on mobile */}
        <header className="md:hidden sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-card/80 backdrop-blur-xl px-4">
          <div className="w-10"> {/* Spacer to balance flex-between */}</div>
          <Logo variant="full" />
          <NotificationsMenu />
        </header>
        {/* Desktop header with sidebar trigger — hidden on mobile */}
        <header className="hidden md:flex sticky top-0 z-10 h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1 text-muted-foreground" />
          <div className="ml-auto">
            <NotificationsMenu />
          </div>
        </header>
        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
        <div className="hidden md:block">
          <Footer />
        </div>
      </SidebarInset>
      {/* Mobile bottom nav — hidden on desktop */}
      <MobileBottomNav />
    </SidebarProvider>
  )
}

export default Layout

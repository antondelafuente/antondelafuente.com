import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

// Detail pages (single viz, single org) hide the site chrome and get the
// full canvas; they're responsible for their own back-link.
const DETAIL_PATH = /^\/(visualizations|orgs)\/[^/]+$/

export function Layout() {
  const { pathname } = useLocation()
  const isDetail = DETAIL_PATH.test(pathname)

  return (
    <div className="min-h-screen bg-background text-foreground">
      {!isDetail && (
        <header className="border-b border-border">
          <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
            <Link to="/" className="font-medium tracking-tight hover:opacity-70 transition-opacity">
              anton de la fuente
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <NavItem to="/visualizations">visualizations</NavItem>
            </nav>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
      {!isDetail && (
        <footer className="mx-auto max-w-5xl px-6 py-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()}
        </footer>
      )}
    </div>
  )
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "hover:text-foreground transition-colors",
          isActive ? "text-foreground" : "text-muted-foreground"
        )
      }
    >
      {children}
    </NavLink>
  )
}

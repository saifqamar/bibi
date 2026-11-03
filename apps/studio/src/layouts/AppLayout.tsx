import { NavLink, Outlet, useNavigate } from "react-router";
import { api } from "@/api";
import { useAuth } from "@/auth/store";
import { NotificationsBell } from "@/components/NotificationsBell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
}

const writerNav: NavItem[] = [{ to: "/writer", label: "My series" }];
const adminNav: NavItem[] = [
  { to: "/admin", label: "Review queue" },
  { to: "/admin/writers", label: "Writers" },
  { to: "/admin/series", label: "Series" },
  { to: "/admin/shelves", label: "Shelves" },
  { to: "/admin/voices", label: "Voices" },
  { to: "/admin/costs", label: "AI costs" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/audit", label: "Audit log" },
];

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          className={({ isActive }) =>
            cn("rounded-[var(--radius)] px-3 py-2 text-sm hover:bg-muted", isActive && "bg-muted font-medium")
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

export function AppLayout() {
  const user = useAuth((s) => s.user);
  const clear = useAuth((s) => s.clear);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col gap-6 border-b border-border p-4 md:w-60 md:border-b-0 md:border-r">
        <div className="px-3 text-lg font-bold">Bibi Studio</div>
        <nav className="flex flex-col gap-4" aria-label="Main">
          <NavSection title="Writer" items={writerNav} />
          {user?.role === "admin" && <NavSection title="Admin" items={adminNav} />}
        </nav>
        <div className="mt-auto flex flex-col gap-2 px-3 text-sm">
          <NotificationsBell />
          <span className="truncate text-muted-foreground">{user?.email}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const refreshToken = useAuth.getState().refreshToken;
              // Revoke the session server-side; sign out locally even if that fails.
              if (refreshToken) void api.POST("/api/v1/auth/logout", { body: { refresh_token: refreshToken } }).catch(() => {});
              clear();
              navigate("/login");
            }}
          >
            Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}

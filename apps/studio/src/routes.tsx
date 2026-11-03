import { lazy, Suspense } from "react";
import { Navigate, type RouteObject } from "react-router";
import { RequireRole } from "@/auth/RequireRole";
import { homeForRole, useAuth } from "@/auth/store";
import { AppLayout } from "@/layouts/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { NotAllowedPage } from "@/pages/NotAllowedPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import WriterApp from "@/writer/WriterApp";

const AdminApp = lazy(() => import("@/admin/AdminApp"));

function HomeRedirect() {
  const user = useAuth((s) => s.user);
  return <Navigate to={user ? homeForRole(user.role) : "/login"} replace />;
}

function Loading() {
  return <p className="text-muted-foreground">Loading…</p>;
}

export const routes: RouteObject[] = [
  { path: "/", element: <HomeRedirect /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/not-allowed", element: <NotAllowedPage /> },
  {
    element: (
      <RequireRole roles={["writer", "admin"]}>
        <AppLayout />
      </RequireRole>
    ),
    children: [
      { path: "/writer/*", element: <WriterApp /> },
      {
        path: "/admin/*",
        element: (
          <RequireRole roles={["admin"]}>
            <Suspense fallback={<Loading />}>
              <AdminApp />
            </Suspense>
          </RequireRole>
        ),
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
];

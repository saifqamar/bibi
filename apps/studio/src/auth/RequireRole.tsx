import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { homeForRole, useAuth, type Role } from "./store";

/** Client-side route guard. The server checks roles on every endpoint as well. */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const user = useAuth((s) => s.user);
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  return <>{children}</>;
}

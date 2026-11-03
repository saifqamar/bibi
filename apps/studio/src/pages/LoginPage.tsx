import { unwrap } from "@bibi/api-client";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { api, storeTokenPair } from "@/api";
import { homeForRole, useAuth } from "@/auth/store";
import { FormError } from "@/components/FormError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/errors";
import { AuthCard } from "./AuthCard";

export function LoginPage() {
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/auth/login", { body: { email, password } })),
    onSuccess: (pair) => {
      storeTokenPair(pair);
      const from = (location.state as { from?: string } | null)?.from;
      const home = homeForRole(pair.user.role);
      navigate(from && home !== "/not-allowed" ? from : home, { replace: true });
    },
  });

  if (user && !login.isPending) return <Navigate to={homeForRole(user.role)} replace />;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate();
  };

  return (
    <AuthCard title="Sign in" description="For Bibi writers and admins.">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <FormError message={login.isError ? errorMessage(login.error) : null} />
        <Button type="submit" disabled={login.isPending}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-xs text-muted-foreground">Writer accounts are created by invitation from an admin.</p>
      </form>
    </AuthCard>
  );
}

import { unwrap } from "@bibi/api-client";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { api, storeTokenPair } from "@/api";
import { FormError } from "@/components/FormError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/errors";
import { AuthCard } from "./AuthCard";

const MIN_PASSWORD = 8;

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const accept = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST("/api/v1/auth/accept-invite", {
          body: { token, password, display_name: displayName || null },
        }),
      ),
    onSuccess: (pair) => {
      storeTokenPair(pair);
      navigate("/writer", { replace: true });
    },
  });

  if (!token) {
    return (
      <AuthCard title="Invite link is incomplete" description="Open the link from your invite email again." >
        <span />
      </AuthCard>
    );
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD) return setLocalError(`Use at least ${MIN_PASSWORD} characters.`);
    if (password !== confirm) return setLocalError("Passwords do not match.");
    setLocalError(null);
    accept.mutate();
  };

  return (
    <AuthCard title="Join Bibi as a writer" description="Set your name and password to finish your invite.">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="display-name">Your name</Label>
          <Input id="display-name" autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="new-password">Password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <FormError message={localError ?? (accept.isError ? errorMessage(accept.error) : null)} />
        <Button type="submit" disabled={accept.isPending}>
          {accept.isPending ? "Creating account…" : "Accept invite"}
        </Button>
      </form>
    </AuthCard>
  );
}

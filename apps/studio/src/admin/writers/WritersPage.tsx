import { unwrap } from "@bibi/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { api } from "@/api";
import { FormError } from "@/components/FormError";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

const keys = { writers: ["admin", "writers"], invites: ["admin", "invites"], counts: ["admin", "writer-counts"] };

export function WritersPage() {
  const queryClient = useQueryClient();
  const refresh = () => Object.values(keys).forEach((key) => void queryClient.invalidateQueries({ queryKey: key }));
  const writers = useQuery({ queryKey: keys.writers, queryFn: async () => unwrap(await api.GET("/api/v1/admin/writers", { params: { query: { limit: 100 } } })) });
  const invites = useQuery({
    queryKey: keys.invites,
    queryFn: async () => unwrap(await api.GET("/api/v1/admin/invites", { params: { query: { status: "pending", limit: 100 } } })),
  });
  const counts = useQuery({ queryKey: keys.counts, queryFn: async () => unwrap(await api.GET("/api/v1/admin/writer-series-counts")) });
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  const invite = useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/admin/invites", { body: { email } })),
    onSuccess: (created) => {
      setSent(created.email);
      setEmail("");
      refresh();
    },
  });
  const inviteAction = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "resend" | "revoke" }) =>
      action === "resend"
        ? unwrap(await api.POST("/api/v1/admin/invites/{invite_id}/resend", { params: { path: { invite_id: id } } }))
        : unwrap(await api.DELETE("/api/v1/admin/invites/{invite_id}", { params: { path: { invite_id: id } } })),
    onSuccess: refresh,
  });
  const writerAction = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "deactivate" | "reactivate" }) =>
      action === "deactivate"
        ? unwrap(await api.POST("/api/v1/admin/writers/{user_id}/deactivate", { params: { path: { user_id: id } } }))
        : unwrap(await api.POST("/api/v1/admin/writers/{user_id}/reactivate", { params: { path: { user_id: id } } })),
    onSuccess: refresh,
  });

  const onInvite = (event: FormEvent) => {
    event.preventDefault();
    setSent(null);
    invite.mutate();
  };

  return (
    <>
      <PageHeader title="Writers" description="Writers join by invitation only. Deactivating a writer signs them out at once; their series stay." />
      <form className="mb-6 flex max-w-xl flex-wrap items-end gap-2" onSubmit={onInvite}>
        <div className="flex min-w-60 flex-1 flex-col gap-1.5">
          <Label htmlFor="invite-email">Invite a writer</Label>
          <Input id="invite-email" type="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" disabled={invite.isPending}>
          Send invite
        </Button>
        {sent && <p className="w-full text-sm text-success">Invite sent to {sent}.</p>}
        <FormError message={invite.isError ? errorMessage(invite.error) : null} />
      </form>

      <QueryState query={invites}>
        {(page) =>
          page.items.length > 0 && (
            <section aria-label="Pending invites" className="mb-8">
              <h2 className="mb-2 font-semibold">Pending invites</h2>
              <ul className="flex flex-col gap-2 text-sm">
                {page.items.map((inv) => (
                  <li key={inv.id} className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{inv.email}</span>
                    <span className="text-muted-foreground">expires {formatDateTime(inv.expires_at)}</span>
                    <Button size="sm" variant="ghost" onClick={() => inviteAction.mutate({ id: inv.id, action: "resend" })}>
                      Resend
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => inviteAction.mutate({ id: inv.id, action: "revoke" })}>
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )
        }
      </QueryState>

      <QueryState query={writers}>
        {(page) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Writer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Series</TableHead>
                <TableHead>Last sign-in</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.items.map((writer) => (
                <TableRow key={writer.id}>
                  <TableCell>
                    <span className="font-medium">{writer.display_name || writer.email}</span>
                    {writer.display_name && <span className="block text-xs text-muted-foreground">{writer.email}</span>}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={writer.status === "active" ? "accepted" : "rejected"} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{counts.data?.[writer.id] ?? 0}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(writer.last_login_at)}</TableCell>
                  <TableCell className="text-right">
                    {writer.status === "active" ? (
                      <Button size="sm" variant="ghost" onClick={() => writerAction.mutate({ id: writer.id, action: "deactivate" })}>
                        Deactivate
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => writerAction.mutate({ id: writer.id, action: "reactivate" })}>
                        Reactivate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </QueryState>
      <FormError message={writerAction.error ? errorMessage(writerAction.error) : inviteAction.error ? errorMessage(inviteAction.error) : null} />
    </>
  );
}

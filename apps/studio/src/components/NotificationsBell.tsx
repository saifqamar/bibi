import { unwrap } from "@bibi/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const key = ["studio", "notifications"] as const;

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: key,
    queryFn: async () => unwrap(await api.GET("/api/v1/studio/notifications")),
    refetchInterval: 60_000,
  });
  const read = useMutation({
    mutationFn: async (id: string) =>
      unwrap(await api.POST("/api/v1/studio/notifications/{notification_id}/read", { params: { path: { notification_id: id } } })),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: key }),
  });
  const unread = query.data?.unread ?? 0;

  return (
    <div className="relative">
      <Button variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="w-full">
        Notifications{unread > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{unread}</span>}
      </Button>
      {open && (
        <ul aria-label="Notifications" className="absolute bottom-full z-10 mb-2 flex max-h-80 w-72 flex-col overflow-y-auto rounded-[var(--radius)] border border-border bg-background p-2 text-sm shadow-lg">
          {(query.data?.items ?? []).length === 0 && <li className="p-2 text-muted-foreground">Nothing yet.</li>}
          {(query.data?.items ?? []).map((note) => (
            <li key={note.id}>
              <button
                type="button"
                className={cn("w-full rounded p-2 text-left hover:bg-muted", !note.read_at && "font-medium")}
                onClick={() => !note.read_at && read.mutate(note.id)}
              >
                {note.message}
                <span className="block text-xs font-normal text-muted-foreground">{formatDateTime(note.created_at)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

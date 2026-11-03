import { unwrap } from "@bibi/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { api } from "@/api";
import { FormError } from "@/components/FormError";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorMessage } from "@/lib/errors";

const key = ["admin", "voices"];

export function VoicesAdminPage() {
  const queryClient = useQueryClient();
  const voices = useQuery({ queryKey: key, queryFn: async () => unwrap(await api.GET("/api/v1/admin/voices")) });
  const empty = { provider: "", provider_voice_id: "", name: "", language: "en", description: "" };
  const [form, setForm] = useState(empty);
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: key });
    void queryClient.invalidateQueries({ queryKey: ["studio", "voices"] });
  };
  const create = useMutation({
    mutationFn: async () => unwrap(await api.POST("/api/v1/admin/voices", { body: form })),
    onSuccess: () => {
      setForm(empty);
      refresh();
    },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) =>
      unwrap(await api.PUT("/api/v1/admin/voices/{voice_id}", { params: { path: { voice_id: id } }, body: { is_active: active } })),
    onSuccess: refresh,
  });
  const set = (k: keyof typeof empty, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate();
  };

  return (
    <>
      <PageHeader title="Voices" description="The voice library writers cast from. Deactivated voices disappear from the writers' list." />
      <form className="mb-6 grid max-w-3xl gap-2 sm:grid-cols-5" onSubmit={onSubmit}>
        <Input aria-label="Voice name" placeholder="Name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        <Input aria-label="Provider" placeholder="Provider" required value={form.provider} onChange={(e) => set("provider", e.target.value)} />
        <Input aria-label="Provider voice id" placeholder="Provider voice id" required value={form.provider_voice_id} onChange={(e) => set("provider_voice_id", e.target.value)} />
        <Input aria-label="Language" placeholder="Language" required value={form.language} onChange={(e) => set("language", e.target.value)} />
        <Button type="submit" disabled={create.isPending}>
          Add voice
        </Button>
      </form>
      <FormError message={create.error ? errorMessage(create.error) : toggle.error ? errorMessage(toggle.error) : null} />
      <QueryState query={voices}>
        {(list) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((voice) => (
                <TableRow key={voice.id}>
                  <TableCell className="font-medium">{voice.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {voice.provider} · {voice.provider_voice_id}
                  </TableCell>
                  <TableCell>{voice.language}</TableCell>
                  <TableCell>{voice.is_active ? "Active" : "Inactive"}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => toggle.mutate({ id: voice.id, active: !voice.is_active })}>
                      {voice.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </QueryState>
    </>
  );
}

import { ApiRequestError, unwrap } from "@bibi/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api } from "@/api";
import { FormError } from "@/components/FormError";
import { QueryState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorMessage } from "@/lib/errors";

const castKey = (seriesId: string) => ["studio", "series", seriesId, "cast"] as const;

/** Fetches a voice preview; the server makes it in the background the first time. */
function VoicePreview({ voiceId }: { voiceId: string }) {
  const [requested, setRequested] = useState(false);
  const query = useQuery({
    queryKey: ["studio", "voices", voiceId, "preview"],
    enabled: requested,
    queryFn: async () => {
      const result = await api.GET("/api/v1/studio/voices/{voice_id}/preview", { params: { path: { voice_id: voiceId } } });
      if (result.error) throw new ApiRequestError(result.response.status, (result.error as { error: never }).error);
      return result.data;
    },
    refetchInterval: (q) => (q.state.data && !q.state.data.url ? 2000 : false),
  });
  if (!requested)
    return (
      <Button size="sm" variant="ghost" onClick={() => setRequested(true)}>
        Preview
      </Button>
    );
  if (query.data?.url) return <audio controls src={query.data.url} className="h-8 max-w-56" aria-label="Voice preview" />;
  return <span className="text-xs text-muted-foreground">Preparing preview…</span>;
}

export function VoicesTab({ seriesId }: { seriesId: string }) {
  const queryClient = useQueryClient();
  const cast = useQuery({
    queryKey: castKey(seriesId),
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/studio/series/{series_id}/voice-assignments", { params: { path: { series_id: seriesId } } })),
  });
  const voices = useQuery({
    queryKey: ["studio", "voices"],
    queryFn: async () => unwrap(await api.GET("/api/v1/studio/voices")),
  });
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const castData = cast.data;
  useEffect(() => {
    if (!castData) return;
    // Seed the form from the server whenever the cast is (re)loaded.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoices(Object.fromEntries(castData.cast.map((m) => [m.character_id ?? "narrator", m.voice_id ?? ""])));
  }, [castData]);

  const save = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.PUT("/api/v1/studio/series/{series_id}/voice-assignments", {
          params: { path: { series_id: seriesId } },
          body: {
            assignments: Object.entries(choices)
              .filter(([, voiceId]) => voiceId)
              .map(([key, voiceId]) => ({ character_id: key === "narrator" ? null : key, voice_id: voiceId })),
          },
        }),
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(castKey(seriesId), data);
      setSaved(true);
    },
  });

  return (
    <QueryState query={cast}>
      {(data) => (
        <div className="flex max-w-4xl flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Pick a voice for the narrator and each character. Characters without a voice, and speakers not in the bible, are read by the narrator.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Voice notes</TableHead>
                <TableHead>Voice</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.cast.map((member) => {
                const key = member.character_id ?? "narrator";
                const value = choices[key] ?? "";
                return (
                  <TableRow key={key}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="max-w-64 text-muted-foreground">{member.voice_notes || "—"}</TableCell>
                    <TableCell>
                      <Select
                        aria-label={`Voice for ${member.name}`}
                        value={value}
                        onChange={(e) => {
                          setSaved(false);
                          setChoices((current) => ({ ...current, [key]: e.target.value }));
                        }}
                      >
                        <option value="">{member.character_id ? "Narrator reads this" : "Choose a voice"}</option>
                        {(voices.data ?? []).map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.language})
                          </option>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell>{value && <VoicePreview key={value} voiceId={value} />}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <FormError message={save.isError ? errorMessage(save.error) : null} />
          <div className="flex items-center gap-3">
            <Button onClick={() => save.mutate()} disabled={save.isPending || !choices.narrator}>
              {save.isPending ? "Saving…" : "Save voices"}
            </Button>
            {!choices.narrator && <span className="text-sm text-muted-foreground">A narrator voice is required.</span>}
            {saved && <span className="text-sm text-success">Saved.</span>}
          </div>
        </div>
      )}
    </QueryState>
  );
}

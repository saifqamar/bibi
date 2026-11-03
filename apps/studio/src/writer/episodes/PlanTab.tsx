import { unwrap } from "@bibi/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api";
import { FormError } from "@/components/FormError";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/errors";
import { episodeKeys, type Episode } from "./queries";

type Beat = Episode["plan"]["beats"][number];

const newId = () => `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function PlanTab({ episode }: { episode: Episode }) {
  const queryClient = useQueryClient();
  const [beats, setBeats] = useState<Beat[]>(episode.plan.beats);
  const [notes, setNotes] = useState(episode.plan.notes);
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: async () =>
      unwrap(
        await api.PUT("/api/v1/studio/episodes/{episode_id}/plan", {
          params: { path: { episode_id: episode.id } },
          body: { beats: beats.filter((b) => b.text.trim()), notes },
        }),
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(episodeKeys.one(episode.id), updated);
      setSaved(true);
    },
  });

  const update = (index: number, text: string) => {
    setSaved(false);
    setBeats((current) => current.map((b, i) => (i === index ? { ...b, text } : b)));
  };
  const move = (index: number, delta: number) => {
    setSaved(false);
    setBeats((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });
  };
  const remove = (index: number) => {
    setSaved(false);
    setBeats((current) => current.filter((_, i) => i !== index));
  };

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Beats are the story flow you decide. The AI drafts the episode to hit each beat, in order.
      </p>
      <ol className="flex flex-col gap-3">
        {beats.map((beat, index) => (
          <li key={beat.id} className="flex gap-2">
            <span className="mt-2 w-6 text-right text-sm text-muted-foreground">{index + 1}.</span>
            <Textarea aria-label={`Beat ${index + 1}`} rows={2} value={beat.text} onChange={(e) => update(index, e.target.value)} />
            <div className="flex flex-col gap-1">
              <Button size="sm" variant="ghost" aria-label={`Move beat ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                ↑
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`Move beat ${index + 1} down`}
                disabled={index === beats.length - 1}
                onClick={() => move(index, 1)}
              >
                ↓
              </Button>
              <Button size="sm" variant="ghost" aria-label={`Remove beat ${index + 1}`} onClick={() => remove(index)}>
                ✕
              </Button>
            </div>
          </li>
        ))}
      </ol>
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSaved(false);
            setBeats((current) => [...current, { id: newId(), text: "" }]);
          }}
        >
          Add beat
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="plan-notes">Notes for this episode</Label>
        <Textarea id="plan-notes" rows={4} value={notes} onChange={(e) => (setSaved(false), setNotes(e.target.value))} />
      </div>
      <FormError message={save.isError ? errorMessage(save.error) : null} />
      <div className="flex items-center gap-3">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save plan"}
        </Button>
        {saved && <span className="text-sm text-success">Saved.</span>}
      </div>
    </div>
  );
}

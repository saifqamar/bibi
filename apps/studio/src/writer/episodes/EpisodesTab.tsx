import { unwrap } from "@bibi/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { api } from "@/api";
import { FormError } from "@/components/FormError";
import { QueryState } from "@/components/QueryState";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorMessage } from "@/lib/errors";
import { formatDuration } from "@/lib/script";
import { episodeKeys, useEpisodes } from "./queries";

export function EpisodesTab({ seriesId }: { seriesId: string }) {
  const query = useEpisodes(seriesId);
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const create = useMutation({
    mutationFn: async () =>
      unwrap(await api.POST("/api/v1/studio/series/{series_id}/episodes", { params: { path: { series_id: seriesId } }, body: { title } })),
    onSuccess: () => {
      setTitle("");
      void queryClient.invalidateQueries({ queryKey: episodeKeys.list(seriesId) });
    },
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate();
  };

  return (
    <div className="flex flex-col gap-4">
      <form className="flex max-w-lg gap-2" onSubmit={submit}>
        <Input aria-label="New episode title" placeholder="Next episode title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        <Button type="submit" disabled={create.isPending}>
          Add episode
        </Button>
      </form>
      <FormError message={create.isError ? errorMessage(create.error) : null} />
      <QueryState query={query}>
        {(episodes) =>
          episodes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No episodes yet. Add one, then plan its beats.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Length / target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {episodes.map((episode) => (
                  <TableRow key={episode.id}>
                    <TableCell>{episode.number}</TableCell>
                    <TableCell>
                      <Link className="font-medium text-primary hover:underline" to={`/writer/series/${seriesId}/episodes/${episode.id}`}>
                        {episode.title || `Episode ${episode.number}`}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={episode.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDuration(episode.estimated_seconds)} / {formatDuration(episode.target_seconds)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        }
      </QueryState>
    </div>
  );
}

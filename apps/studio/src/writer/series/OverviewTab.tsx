import { unwrap } from "@bibi/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api";
import { FormError } from "@/components/FormError";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/errors";
import { seriesKeys, type Series } from "./queries";
import { SeriesForm, type SeriesFormValues } from "./SeriesForm";

export function OverviewTab({ series }: { series: Series }) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const refresh = (updated: Series) => {
    queryClient.setQueryData(seriesKeys.one(series.id), updated);
    void queryClient.invalidateQueries({ queryKey: seriesKeys.all });
  };

  const save = useMutation({
    mutationFn: async (values: SeriesFormValues) =>
      unwrap(await api.PUT("/api/v1/studio/series/{series_id}", { params: { path: { series_id: series.id } }, body: values })),
    onSuccess: (updated) => {
      refresh(updated);
      setSaved(true);
    },
  });

  const cover = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return unwrap(
        await api.POST("/api/v1/studio/series/{series_id}/cover", {
          params: { path: { series_id: series.id } },
          body: form as never,
          bodySerializer: (body) => body as unknown as FormData,
        }),
      );
    },
    onSuccess: refresh,
  });

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="flex-1">
        <SeriesForm
          key={series.updated_at}
          initial={series}
          submitLabel="Save changes"
          pending={save.isPending}
          error={save.isError ? errorMessage(save.error) : null}
          onSubmit={(values) => {
            setSaved(false);
            save.mutate(values);
          }}
        />
        {saved && <p className="mt-2 text-sm text-success">Saved.</p>}
      </div>
      <div className="flex w-full flex-col gap-3 lg:w-64">
        <Label htmlFor="cover-upload">Cover</Label>
        <div className="aspect-square w-full overflow-hidden rounded-[var(--radius)] border border-border bg-muted">
          {series.cover_url ? (
            <img src={series.cover_url} alt={`Cover for ${series.title}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No cover yet</div>
          )}
        </div>
        <input
          id="cover-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) cover.mutate(file);
          }}
        />
        <p className="text-xs text-muted-foreground">JPEG, PNG or WebP, up to 5 MB.</p>
        <FormError message={cover.isError ? errorMessage(cover.error) : null} />
      </div>
    </div>
  );
}

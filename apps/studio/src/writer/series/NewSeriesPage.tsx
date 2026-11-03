import { unwrap } from "@bibi/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api } from "@/api";
import { PageHeader } from "@/components/PageHeader";
import { errorMessage } from "@/lib/errors";
import { seriesKeys } from "./queries";
import { EMPTY_SERIES, SeriesForm, type SeriesFormValues } from "./SeriesForm";

export function NewSeriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: async (values: SeriesFormValues) => unwrap(await api.POST("/api/v1/studio/series", { body: values })),
    onSuccess: (series) => {
      void queryClient.invalidateQueries({ queryKey: seriesKeys.all });
      navigate(`/writer/series/${series.id}`);
    },
  });
  return (
    <>
      <PageHeader title="New series" description="You can change all of this later." />
      <SeriesForm
        initial={EMPTY_SERIES}
        submitLabel="Create series"
        pending={create.isPending}
        error={create.isError ? errorMessage(create.error) : null}
        onSubmit={(values) => create.mutate(values)}
      />
    </>
  );
}

"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { useState } from "react";

interface Sample {
  url: string;
  duration_seconds: string;
  episode_number: number;
}

async function fetchSample(seriesId: string): Promise<Sample> {
  // Same-origin route handler: the browser never talks to the API or sees episode URLs.
  const response = await fetch(`/api/series/${seriesId}/sample`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("The sample is not available right now.");
  return (await response.json()) as Sample;
}

function Player({ seriesId }: { seriesId: string }) {
  const [requested, setRequested] = useState(false);
  const sample = useQuery({
    queryKey: ["sample", seriesId],
    queryFn: () => fetchSample(seriesId),
    enabled: requested,
    staleTime: 5 * 60_000, // the signed URL lives 10 minutes
    retry: false,
  });

  if (!requested) {
    return (
      <button
        type="button"
        onClick={() => setRequested(true)}
        className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 font-semibold"
      >
        ▶ Play a sample
      </button>
    );
  }
  if (sample.isError)
    return (
      <p role="alert" className="text-sm text-muted">
        {sample.error.message}
      </p>
    );
  if (!sample.data)
    return <p className="text-sm text-muted">Loading sample…</p>;
  return (
    <figure className="flex flex-col gap-1">
      <audio
        aria-label="Sample"
        src={sample.data.url}
        controls
        autoPlay
        preload="none"
        className="w-full max-w-md"
      />
      <figcaption className="text-xs text-muted">
        The first {Math.round(Number(sample.data.duration_seconds))} seconds of
        episode {sample.data.episode_number}
      </figcaption>
    </figure>
  );
}

/** Client island: everything else on the series page is server-rendered. */
export function SamplePlayer({ seriesId }: { seriesId: string }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <Player seriesId={seriesId} />
    </QueryClientProvider>
  );
}

import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/errors";

/** Renders loading and error states for a query, and the children once data is there. */
export function QueryState<T>({ query, children }: { query: UseQueryResult<T>; children: (data: T) => ReactNode }) {
  if (query.isPending) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (query.isError)
    return (
      <div role="alert" className="flex items-center gap-3 text-sm text-destructive">
        {errorMessage(query.error)}
        <Button size="sm" variant="outline" onClick={() => query.refetch()}>
          Retry
        </Button>
      </div>
    );
  return <>{children(query.data)}</>;
}

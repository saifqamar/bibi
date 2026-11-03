import { unwrap } from "@bibi/api-client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { api } from "@/api";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";

export function ReviewQueuePage() {
  const query = useQuery({
    queryKey: ["admin", "review-queue"],
    queryFn: async () => unwrap(await api.GET("/api/v1/admin/review-queue", { params: { query: { limit: 100 } } })),
    refetchInterval: 30_000,
  });
  return (
    <>
      <PageHeader title="Review queue" description="Every episode is reviewed before listeners can hear it. Oldest first." />
      <QueryState query={query}>
        {(page) =>
          page.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing to review.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Series</TableHead>
                  <TableHead>Episode</TableHead>
                  <TableHead>Version</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">{formatDateTime(item.submitted_at)}</TableCell>
                    <TableCell>{item.series_title}</TableCell>
                    <TableCell>
                      <Link className="font-medium text-primary hover:underline" to={`/admin/reviews/${item.id}`}>
                        {item.episode_number}. {item.episode_title || "Untitled"}
                      </Link>
                    </TableCell>
                    <TableCell>v{item.draft_version}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        }
      </QueryState>
    </>
  );
}

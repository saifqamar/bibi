import { unwrap } from "@bibi/api-client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";
import { api } from "@/api";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SeriesAdminPage() {
  const [q, setQ] = useState("");
  const query = useQuery({
    queryKey: ["admin", "series", q],
    queryFn: async () => unwrap(await api.GET("/api/v1/admin/series", { params: { query: { limit: 100, ...(q ? { q } : {}) } } })),
  });
  const writers = useQuery({ queryKey: ["admin", "writers"], queryFn: async () => unwrap(await api.GET("/api/v1/admin/writers", { params: { query: { limit: 100 } } })) });
  const writerName = (id: string | null | undefined) => writers.data?.items.find((w) => w.id === id)?.email ?? "—";

  return (
    <>
      <PageHeader title="Series" description="Every series, whatever its status." />
      <Input className="mb-4 max-w-xs" type="search" aria-label="Search series" placeholder="Search by title" value={q} onChange={(e) => setQ(e.target.value)} />
      <QueryState query={query}>
        {(page) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Writer</TableHead>
                <TableHead className="text-right">Free episodes</TableHead>
                <TableHead className="text-right">Plays</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {page.items.map((series) => (
                <TableRow key={series.id}>
                  <TableCell>
                    <Link className="font-medium text-primary hover:underline" to={`/admin/series/${series.id}`}>
                      {series.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={series.status} />
                  </TableCell>
                  <TableCell>{writerName(series.owner_writer_id)}</TableCell>
                  <TableCell className="text-right tabular-nums">{series.free_episode_count}</TableCell>
                  <TableCell className="text-right tabular-nums">{series.play_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </QueryState>
    </>
  );
}

import { unwrap } from "@bibi/api-client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";

const PAGE = 50;

export function AuditLogPage() {
  const [filters, setFilters] = useState({ actor_id: "", entity_type: "", entity_id: "", from: "", to: "" });
  const [offset, setOffset] = useState(0);
  const query = useQuery({
    queryKey: ["admin", "audit", filters, offset],
    queryFn: async () => {
      const active = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      return unwrap(await api.GET("/api/v1/admin/audit-log", { params: { query: { ...active, limit: PAGE, offset } } }));
    },
  });
  const set = (key: keyof typeof filters, value: string) => {
    setOffset(0);
    setFilters((f) => ({ ...f, [key]: value }));
  };
  return (
    <>
      <PageHeader title="Audit log" description="Every write by writers and admins." />
      <div className="mb-4 grid gap-3 sm:grid-cols-5">
        {(
          [
            ["actor_id", "Actor id", "text"],
            ["entity_type", "Entity type", "text"],
            ["entity_id", "Entity id", "text"],
            ["from", "From", "date"],
            ["to", "To", "date"],
          ] as const
        ).map(([key, label, type]) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={`audit-${key}`}>{label}</Label>
            <Input id={`audit-${key}`} type={type} value={filters[key]} onChange={(e) => set(key, e.target.value)} />
          </div>
        ))}
      </div>
      <QueryState query={query}>
        {(page) => (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.items.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(entry.created_at)}</TableCell>
                    <TableCell className="font-medium">{entry.action}</TableCell>
                    <TableCell>
                      {entry.entity_type}
                      {entry.entity_id && <span className="block text-xs text-muted-foreground">{entry.entity_id}</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entry.actor_id ?? "system"}</TableCell>
                    <TableCell>
                      <code className="text-xs">{JSON.stringify(entry.metadata)}</code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>
                Newer
              </Button>
              <Button size="sm" variant="outline" disabled={offset + PAGE >= page.total} onClick={() => setOffset(offset + PAGE)}>
                Older
              </Button>
              <span className="text-muted-foreground">{page.total} entries</span>
            </div>
          </>
        )}
      </QueryState>
    </>
  );
}

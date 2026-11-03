import { unwrap } from "@bibi/api-client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber, formatUsd } from "@/lib/format";

type GroupBy = "series" | "episode" | "purpose" | "model";

export function CostsPage() {
  const [groupBy, setGroupBy] = useState<GroupBy>("series");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const query = useQuery({
    queryKey: ["admin", "costs", groupBy, from, to],
    queryFn: async () =>
      unwrap(await api.GET("/api/v1/admin/costs", { params: { query: { group_by: groupBy, ...(from ? { from } : {}), ...(to ? { to } : {}) } } })),
  });
  return (
    <>
      <PageHeader title="AI costs" description="LLM, embedding and text-to-speech spend, priced when each call was made." />
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cost-group">Group by</Label>
          <Select id="cost-group" className="w-36" value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
            <option value="series">Series</option>
            <option value="episode">Episode</option>
            <option value="purpose">Purpose</option>
            <option value="model">Model</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cost-from">From</Label>
          <Input id="cost-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cost-to">To</Label>
          <Input id="cost-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <QueryState query={query}>
        {(data) => (
          <>
            <p className="mb-4 text-3xl font-semibold tabular-nums" aria-label="Total cost">
              {formatUsd(data.total_usd)}
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{groupBy[0].toUpperCase() + groupBy.slice(1)}</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Input tokens</TableHead>
                  <TableHead className="text-right">Output tokens</TableHead>
                  <TableHead className="text-right">TTS characters</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => (
                  <TableRow key={row.key || "none"}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatUsd(row.cost_usd)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.input_tokens)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.output_tokens)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(row.tts_characters)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </QueryState>
    </>
  );
}

import { Badge, type BadgeProps } from "@/components/ui/badge";

const VARIANTS: Record<string, BadgeProps["variant"]> = {
  draft: "muted",
  planned: "muted",
  drafting: "outline",
  in_review: "warning",
  changes_requested: "warning",
  ready_for_audio: "outline",
  audio_ready: "outline",
  approved: "success",
  published: "success",
  archived: "muted",
  open: "warning",
  resolved: "success",
  pending: "warning",
  accepted: "success",
  rejected: "destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANTS[status] ?? "muted"}>{status.replace(/_/g, " ")}</Badge>;
}

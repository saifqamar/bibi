import { Link } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSeriesList } from "./queries";

export function SeriesListPage() {
  const query = useSeriesList();
  return (
    <>
      <PageHeader
        title="My series"
        description="Each series has its own story bible, episode plan and voices."
        actions={
          <Button asChild>
            <Link to="/writer/series/new">New series</Link>
          </Button>
        }
      />
      <QueryState query={query}>
        {(page) =>
          page.items.length === 0 ? (
            <Card className="max-w-lg">
              <CardHeader>
                <CardTitle>No series yet</CardTitle>
                <CardDescription>Start with a premise. You can build the story bible and plan episodes next.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {page.items.map((series) => (
                <li key={series.id}>
                  <Link to={`/writer/series/${series.id}`} className="block h-full rounded-[var(--radius)] focus-visible:ring-2 focus-visible:ring-primary">
                    <Card className="h-full transition-colors hover:bg-muted/50">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="truncate">{series.title}</CardTitle>
                          <StatusBadge status={series.status} />
                        </div>
                        <CardDescription className="line-clamp-3">{series.premise || "No premise yet."}</CardDescription>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground">
                        {series.language.toUpperCase()} · {series.target_episode_minutes} min episodes
                        {series.themes.length > 0 && ` · ${series.themes.join(", ")}`}
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )
        }
      </QueryState>
    </>
  );
}

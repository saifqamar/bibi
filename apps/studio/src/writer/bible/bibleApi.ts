import { ApiRequestError, unwrap } from "@bibi/api-client";
import { api } from "@/api";
import type { Entry, SectionDef } from "./sections";

// The bible routes share one shape per section; the typed client is used with one
// representative path so the generic code stays simple.
type ListPath = "/api/v1/studio/series/{series_id}/characters";
type ItemPath = "/api/v1/studio/series/{series_id}/characters/{entity_id}";

const listPath = (section: SectionDef) => `/api/v1/studio/series/{series_id}/${section.key}` as ListPath;
const itemPath = (section: SectionDef) => `/api/v1/studio/series/{series_id}/${section.key}/{entity_id}` as ItemPath;

export async function createEntry(seriesId: string, section: SectionDef, body: Record<string, unknown>): Promise<Entry> {
  return unwrap(await api.POST(listPath(section), { params: { path: { series_id: seriesId } }, body: body as never })) as unknown as Entry;
}

export async function updateEntry(seriesId: string, section: SectionDef, id: string, body: Record<string, unknown>): Promise<Entry> {
  return unwrap(
    await api.PUT(itemPath(section), { params: { path: { series_id: seriesId, entity_id: id } }, body: body as never }),
  ) as unknown as Entry;
}

export type DeleteResult = { deleted: true } | { deleted: false; references: string[] };

/** Deletes an entry; returns the references instead when it is still in use and not forced. */
export async function deleteEntry(seriesId: string, section: SectionDef, id: string, force: boolean): Promise<DeleteResult> {
  try {
    unwrap(
      await api.DELETE(itemPath(section), {
        params: { path: { series_id: seriesId, entity_id: id }, query: { force } as never },
      }),
    );
    return { deleted: true };
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === "entity_in_use") {
      return { deleted: false, references: (error.details.references as string[]) ?? [] };
    }
    throw error;
  }
}

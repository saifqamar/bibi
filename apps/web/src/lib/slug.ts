/** URL-friendly words from a title: "The Harbour, Part II" → "the-harbour-part-ii". */
export function slugify(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug || "series";
}

export function seriesPath(series: { id: string; title: string }): string {
  return `/series/${series.id}/${slugify(series.title)}`;
}

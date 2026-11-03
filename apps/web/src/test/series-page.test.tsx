import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import SeriesPage, { generateMetadata } from "@/app/series/[id]/[slug]/page";
import sitemap from "@/app/sitemap";
import { SERIES_ID, detail, json, mockFetch, series } from "./fixtures";

const API = "/api/v1/public";
const params = (slug = "harbour-lights", id = SERIES_ID) => ({
  params: Promise.resolve({ id, slug }),
});

afterEach(() => vi.unstubAllGlobals());

describe("series page", () => {
  it("renders the full content as server HTML, with no client JavaScript needed", async () => {
    mockFetch({ [`${API}/series/${SERIES_ID}`]: () => json(detail()) });
    const html = renderToStaticMarkup(await SeriesPage(params()));
    for (const text of [
      "Harbour Lights",
      "A lighthouse keeper hears a bell no one rings.",
      "AI-assisted",
      "Fog",
      "Bells",
      "family",
      "1.5K plays",
      "EN",
    ]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('href="bibi://series/' + SERIES_ID + '"');
    expect(html).toContain("Play a sample");
    const ld = JSON.parse(
      html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1]!,
    );
    expect(ld).toMatchObject({
      "@type": "PodcastSeries",
      name: "Harbour Lights",
      inLanguage: "en",
    });
    expect(ld.hasPart).toHaveLength(2);
    expect(ld.hasPart[0]).toMatchObject({
      episodeNumber: 1,
      name: "Fog",
      timeRequired: "PT912S",
    });
  });

  it("hides the sample player when there is no sample", async () => {
    mockFetch({
      [`${API}/series/${SERIES_ID}`]: () => json(detail({ has_sample: false })),
    });
    expect(renderToStaticMarkup(await SeriesPage(params()))).not.toContain(
      "Play a sample",
    );
  });

  it("is a 404 when the series is not published", async () => {
    mockFetch({});
    await expect(SeriesPage(params())).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
    await expect(SeriesPage(params("x", "not-a-uuid"))).rejects.toMatchObject({
      digest: expect.stringContaining("404"),
    });
  });

  it("redirects an outdated slug to the canonical URL", async () => {
    mockFetch({ [`${API}/series/${SERIES_ID}`]: () => json(detail()) });
    await expect(SeriesPage(params("old-title"))).rejects.toMatchObject({
      digest: expect.stringContaining(`/series/${SERIES_ID}/harbour-lights`),
    });
  });

  it("has search and social metadata", async () => {
    mockFetch({ [`${API}/series/${SERIES_ID}`]: () => json(detail()) });
    const metadata = await generateMetadata(params());
    expect(metadata.title).toBe("Harbour Lights");
    expect(metadata.description).toBe(
      "A lighthouse keeper hears a bell no one rings.",
    );
    expect(metadata.alternates?.canonical).toBe(
      `/series/${SERIES_ID}/harbour-lights`,
    );
    expect(metadata.openGraph?.images).toEqual([
      { url: series().cover_url, alt: "Harbour Lights" },
    ]);
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });
});

describe("sitemap", () => {
  it("lists the home page and published series from the API", async () => {
    mockFetch({
      [`${API}/sitemap`]: () =>
        json([
          {
            id: SERIES_ID,
            title: "Harbour Lights",
            updated_at: "2026-10-01T00:00:00Z",
          },
        ]),
    });
    const entries = await sitemap();
    expect(entries.map((e) => e.url)).toEqual([
      "http://localhost:3001/",
      `http://localhost:3001/series/${SERIES_ID}/harbour-lights`,
    ]);
  });

  it("still serves the home page if the API is down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    expect((await sitemap()).map((e) => e.url)).toEqual([
      "http://localhost:3001/",
    ]);
  });
});

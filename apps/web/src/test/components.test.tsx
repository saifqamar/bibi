import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SamplePlayer } from "@/components/SamplePlayer";
import { SeriesCard } from "@/components/SeriesCard";
import { slugify } from "@/lib/slug";
import { SERIES_ID, json, mockFetch, series } from "./fixtures";

afterEach(() => vi.unstubAllGlobals());

describe("sample player", () => {
  it("loads the signed sample URL from the site, not the API, only when asked", async () => {
    const urls = mockFetch({
      [`/api/series/${SERIES_ID}/sample`]: () =>
        json({
          url: "https://media.example/audio/e1/sample-a.mp3?sig=s",
          duration_seconds: "90.0",
          episode_number: 1,
        }),
    });
    render(<SamplePlayer seriesId={SERIES_ID} />);
    expect(urls).toEqual([]);
    await userEvent.click(
      screen.getByRole("button", { name: /play a sample/i }),
    );
    const audio = await screen.findByLabelText("Sample");
    expect(audio).toHaveAttribute(
      "src",
      "https://media.example/audio/e1/sample-a.mp3?sig=s",
    );
    expect(
      screen.getByText("The first 90 seconds of episode 1"),
    ).toBeInTheDocument();
    expect(urls).toEqual([`/api/series/${SERIES_ID}/sample`]);
  });

  it("says when the sample is unavailable", async () => {
    mockFetch({});
    render(<SamplePlayer seriesId={SERIES_ID} />);
    await userEvent.click(
      screen.getByRole("button", { name: /play a sample/i }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("not available");
  });
});

describe("series card", () => {
  it("links to the canonical page and shows the AI label", () => {
    render(<SeriesCard series={series()} />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      `/series/${SERIES_ID}/harbour-lights`,
    );
    expect(screen.getByText("AI-assisted")).toBeInTheDocument();
  });
});

describe("slugify", () => {
  it("makes readable, safe URL words", () => {
    expect(slugify("The Harbour, Part II")).toBe("the-harbour-part-ii");
    expect(slugify("Café Noël!")).toBe("cafe-noel");
    expect(slugify("???")).toBe("series");
  });
});

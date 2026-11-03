import { afterEach, describe, expect, it, vi } from "vitest";
import { parseEvents, readEventStream } from "./sse";

afterEach(() => vi.unstubAllGlobals());

describe("server-sent events", () => {
  it("parses complete blocks and keeps partial ones", () => {
    const { events, rest } = parseEvents('id: 1\nevent: progress\ndata: {"a":1}\n\n: keep-alive\n\nid: 2\nevent: end\ndata: {}\n\nid: 3\nda');
    expect(events).toEqual([
      { id: "1", event: "progress", data: '{"a":1}' },
      { id: "2", event: "end", data: "{}" },
    ]);
    expect(rest).toBe("id: 3\nda");
  });

  it("reads a streamed response with auth headers", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("id: 1\nevent: progress\nda"));
        controller.enqueue(encoder.encode('ta: {"step":"draft"}\n\nid: 2\nevent: end\ndata: {"status":"waiting"}\n\n'));
        controller.close();
      },
    });
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(body, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const seen: string[] = [];
    await readEventStream("http://x/events", { Authorization: "Bearer t" }, (e) => seen.push(`${e.event}:${e.data}`));
    expect(seen).toEqual(['progress:{"step":"draft"}', 'end:{"status":"waiting"}']);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ headers: { Authorization: "Bearer t" } });
  });
});

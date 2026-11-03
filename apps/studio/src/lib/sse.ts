export interface ServerEvent {
  id: string | null;
  event: string;
  data: string;
}

/** Parses complete server-sent-event blocks out of `buffer`; returns events and the leftover. */
export function parseEvents(buffer: string): { events: ServerEvent[]; rest: string } {
  const events: ServerEvent[] = [];
  const blocks = buffer.split(/\r?\n\r?\n/);
  const rest = blocks.pop() ?? "";
  for (const block of blocks) {
    let id: string | null = null;
    let event = "message";
    const data: string[] = [];
    for (const line of block.split(/\r?\n/)) {
      if (!line || line.startsWith(":")) continue;
      const colon = line.indexOf(":");
      const field = colon === -1 ? line : line.slice(0, colon);
      const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");
      if (field === "id") id = value;
      else if (field === "event") event = value;
      else if (field === "data") data.push(value);
    }
    if (data.length || event !== "message") events.push({ id, event, data: data.join("\n") });
  }
  return { events, rest };
}

/**
 * Reads an authenticated event stream with fetch (EventSource cannot send headers).
 * Resolves when the server closes the stream or `signal` aborts.
 */
export async function readEventStream(
  url: string,
  headers: Record<string, string>,
  onEvent: (event: ServerEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(url, { headers: { Accept: "text/event-stream", ...headers }, signal });
  if (!response.ok || !response.body) throw new Error(`Event stream failed (${response.status})`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parsed = parseEvents(buffer);
    buffer = parsed.rest;
    parsed.events.forEach(onEvent);
  }
  if (buffer.trim()) parseEvents(buffer + "\n\n").events.forEach(onEvent);
}

import { API_URL } from "@/lib/config";

/** Proxies the public sample endpoint so the browser stays same-origin. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return Response.json({ error: "Not found" }, { status: 404 });
  const upstream = await fetch(`${API_URL}/api/v1/public/series/${id}/sample`, {
    cache: "no-store",
  });
  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

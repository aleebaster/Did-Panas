import { NpRequestError, NpUnavailableError, type NpOption } from "@/lib/nova-poshta";

const JSON_HEADERS = { "Cache-Control": "private, max-age=60" };

export function readQuery(request: Request, name: string): string {
  const { searchParams } = new URL(request.url);
  return (searchParams.get(name) ?? "").trim();
}

export function badRequest(message: string): Response {
  return Response.json({ items: [], error: message }, { status: 400 });
}

export async function respondWithSuggestions(
  load: () => Promise<NpOption[]>,
): Promise<Response> {
  try {
    const items = await load();
    return Response.json({ items }, { headers: JSON_HEADERS });
  } catch (error) {
    if (error instanceof NpUnavailableError) {
      return Response.json(
        { items: [], error: error.message, unavailable: true },
        { status: 503, headers: JSON_HEADERS },
      );
    }
    if (error instanceof NpRequestError) {
      return Response.json(
        { items: [], error: error.message },
        { status: 502, headers: JSON_HEADERS },
      );
    }
    console.error(
      "[nova-poshta] unexpected error:",
      error instanceof Error ? error.message : String(error),
    );
    return Response.json(
      { items: [], error: "Не вдалося отримати довідник Нової пошти." },
      { status: 500, headers: JSON_HEADERS },
    );
  }
}

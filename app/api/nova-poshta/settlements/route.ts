import { searchSettlements } from "@/lib/nova-poshta";
import { badRequest, readQuery, respondWithSuggestions } from "../common";

export async function GET(request: Request): Promise<Response> {
  const query = readQuery(request, "q");

  if (query.length > 64) {
    return badRequest("Запит задовгий.");
  }
  if (query.length < 2) {
    return Response.json({ items: [] });
  }

  return respondWithSuggestions(() => searchSettlements(query));
}

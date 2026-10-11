import { isNpRef, searchStreets } from "@/lib/nova-poshta";
import { badRequest, readQuery, respondWithSuggestions } from "../common";

export async function GET(request: Request): Promise<Response> {
  const query = readQuery(request, "q");
  const settlementRef = readQuery(request, "cityRef");

  if (!isNpRef(settlementRef)) {
    return badRequest("Спершу оберіть населений пункт.");
  }
  if (query.length > 64) {
    return badRequest("Запит задовгий.");
  }
  if (query.length < 2) {
    return Response.json({ items: [] });
  }

  return respondWithSuggestions(() => searchStreets(settlementRef, query));
}

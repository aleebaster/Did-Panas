import { isNpRef, searchWarehouses, type WarehouseKind } from "@/lib/nova-poshta";
import { badRequest, readQuery, respondWithSuggestions } from "../common";

const KINDS: WarehouseKind[] = ["department", "postamat"];

export async function GET(request: Request): Promise<Response> {
  const cityRef = readQuery(request, "cityRef");
  const kind = readQuery(request, "kind") || "department";
  const query = readQuery(request, "q");

  if (!isNpRef(cityRef)) {
    return badRequest("Спершу оберіть населений пункт.");
  }
  if (!KINDS.includes(kind as WarehouseKind)) {
    return badRequest("Невідомий тип відділення.");
  }
  if (query.length > 64) {
    return badRequest("Запит задовгий.");
  }

  return respondWithSuggestions(() =>
    searchWarehouses(cityRef, kind as WarehouseKind, query),
  );
}

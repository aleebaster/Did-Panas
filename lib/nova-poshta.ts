const NP_API_URL = "https://api.novaposhta.ua/v2.0/json/";
const NP_TIMEOUT_MS = 8000;
const MAX_WAREHOUSE_PAGES = 8;
const WAREHOUSE_PAGE_SIZE = "100";
const WAREHOUSE_PAGE_DELAY_MS = 350;
const WAREHOUSE_RETRY_DELAY_MS = 1200;

const TTL = {
  settlements: 5 * 60_000,
  streets: 5 * 60_000,
  warehouses: 15 * 60_000,
  warehouseTypes: 60 * 60_000,
} as const;

export interface NpOption {
  ref: string;
  label: string;
  hint?: string;
}

export type WarehouseKind = "department" | "postamat";

export class NpUnavailableError extends Error {
  constructor(message = "Довідник Нової пошти не налаштовано.") {
    super(message);
    this.name = "NpUnavailableError";
  }
}

export class NpRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NpRequestError";
  }
}

type NpRow = Record<string, unknown>;

interface NpEnvelope {
  success?: boolean;
  data?: NpRow[];
  errors?: unknown[];
}

interface CacheEntry {
  expires: number;
  value: unknown;
}

const cache = new Map<string, CacheEntry>();

function readApiKey(): string | null {
  const key = process.env.NOVA_POSHTA_API_KEY?.trim();
  return key ? key : null;
}

export function isNpConfigured(): boolean {
  return readApiKey() !== null;
}

function pruneCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expires <= now) {
      cache.delete(key);
    }
  }
  if (cache.size > 200) {
    cache.clear();
  }
}

async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  pruneCache();
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.value as T;
  }
  const value = await load();
  cache.set(key, { expires: Date.now() + ttl, value });
  return value;
}

function describeErrors(errors: unknown[]): string {
  const parts = errors.map((error) => {
    if (typeof error === "string") {
      return error;
    }
    if (error && typeof error === "object") {
      const record = error as { Message?: string; message?: string };
      return record.Message ?? record.message ?? "";
    }
    return "";
  });
  const message = parts.filter(Boolean).join(" ");
  return message || "Нова пошта повернула помилку.";
}

async function npCall(
  modelName: string,
  calledMethod: string,
  methodProperties: Record<string, string>,
): Promise<NpRow[]> {
  const apiKey = readApiKey();
  if (!apiKey) {
    throw new NpUnavailableError();
  }

  let response: Response;
  try {
    response = await fetch(NP_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, modelName, calledMethod, methodProperties }),
      cache: "no-store",
      signal: AbortSignal.timeout(NP_TIMEOUT_MS),
    });
  } catch {
    throw new NpRequestError("Не вдалося звʼязатися з Новою поштою.");
  }

  if (!response.ok) {
    throw new NpRequestError(`Нова пошта: HTTP ${response.status}.`);
  }

  let payload: NpEnvelope;
  try {
    payload = (await response.json()) as NpEnvelope;
  } catch {
    throw new NpRequestError("Нова пошта повернула некоректну відповідь.");
  }

  if (payload.success === false) {
    throw new NpRequestError(describeErrors(payload.errors ?? []));
  }

  return Array.isArray(payload.data) ? payload.data : [];
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueRef(prefix: string, index: number, fallback: string): string {
  const ref = text(fallback);
  return ref || `${prefix}-${index}`;
}

function uniqueByRef(options: NpOption[]): NpOption[] {
  const seen = new Set<string>();
  return options.filter((option) => {
    if (seen.has(option.ref)) {
      return false;
    }
    seen.add(option.ref);
    return true;
  });
}

function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").slice(0, 64);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isNpRef(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

function flattenSettlements(rows: NpRow[]): NpRow[] {
  const flat: NpRow[] = [];
  for (const row of rows) {
    const nested = row.Addresses;
    if (Array.isArray(nested) && nested.length > 0) {
      for (const item of nested) {
        if (item && typeof item === "object") {
          flat.push(item as NpRow);
        }
      }
      continue;
    }
    flat.push(row);
  }
  return flat;
}

function settlementOption(row: NpRow, index: number): NpOption {
  const label =
    text(row.MainDescription) || text(row.Description) || text(row.Settlement);
  const regionParts = [text(row.Region), text(row.Area)].filter(
    (part) => part && !label.includes(part),
  );
  return {
    ref: uniqueRef(
      "settlement",
      index,
      text(row.DeliveryCity) || text(row.Ref),
    ),
    label,
    hint: regionParts.join(", ") || undefined,
  };
}

export async function searchSettlements(query: string): Promise<NpOption[]> {
  const q = normalizeQuery(query);
  if (q.length < 2) {
    return [];
  }

  const key = `settlements:${q.toLowerCase()}`;
  return cached(key, TTL.settlements, async () => {
    let direct: NpOption[] = [];
    try {
      const rows = await npCall("Address", "searchSettlements", {
        CityName: q,
        Limit: "10",
        Page: "1",
      });
      direct = uniqueByRef(
        flattenSettlements(rows)
          .map(settlementOption)
          .filter((option) => option.label),
      );
    } catch (error) {
      if (!(error instanceof NpRequestError)) {
        throw error;
      }
    }

    if (direct.length > 0) {
      return direct;
    }

    const fallback = await npCall("Address", "getCities", {
      FindByString: q,
      Limit: "10",
      Page: "1",
    });

    return uniqueByRef(
      fallback
        .map((row, index) => {
          const label = text(row.Description);
          const area = text(row.Area);
          return {
            ref: uniqueRef("city", index, text(row.Ref)),
            label,
            hint: area || undefined,
          };
        })
        .filter((option) => option.label),
    );
  });
}

export async function searchStreets(
  settlementRef: string,
  query: string,
): Promise<NpOption[]> {
  const q = normalizeQuery(query);
  if (q.length < 2 || !isNpRef(settlementRef)) {
    return [];
  }

  const key = `streets:${settlementRef}:${q.toLowerCase()}`;
  return cached(key, TTL.streets, async () => {
    let direct: NpOption[] = [];
    try {
      const rows = await npCall("Address", "searchSettlementStreets", {
        SettlementRef: settlementRef,
        StreetName: q,
        Limit: "10",
      });
      direct = uniqueByRef(
        flattenSettlements(rows)
          .map((row, index) => ({
            ref: uniqueRef("street", index, text(row.SettlementStreetRef)),
            label:
              text(row.Present) || text(row.SettlementStreetDescription),
            hint: text(row.StreetsTypeDescription) || undefined,
          }))
          .filter((option) => option.label),
      );
    } catch (error) {
      if (!(error instanceof NpRequestError)) {
        throw error;
      }
    }

    if (direct.length > 0) {
      return direct;
    }

    const fallback = await npCall("Address", "getStreet", {
      CityRef: settlementRef,
      FindByString: q,
      Limit: "10",
      Page: "1",
    });

    return uniqueByRef(
      fallback
        .map((row, index) => ({
          ref: uniqueRef("street", index, text(row.Ref)),
          label: text(row.Description),
          hint: text(row.StreetsType) || undefined,
        }))
        .filter((option) => option.label),
    );
  });
}

async function loadWarehouseTypeRefs(): Promise<string[]> {
  return cached("warehouse-types", TTL.warehouseTypes, async () => {
    const rows = await npCall("Address", "getWarehouseTypes", {});
    return rows
      .filter((row) => /поштомат/i.test(text(row.Description)))
      .map((row) => text(row.Ref))
      .filter(Boolean);
  });
}

function isTransientNpError(error: unknown): boolean {
  if (!(error instanceof NpRequestError)) {
    return false;
  }
  return /many requests|rate|timeout|HTTP [45]|Не вдалося/iu.test(
    error.message,
  );
}

async function fetchWarehousePage(
  cityRef: string,
  page: number,
): Promise<NpRow[]> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) {
      await sleep(WAREHOUSE_RETRY_DELAY_MS);
    }
    try {
      return await npCall("Address", "getWarehouses", {
        CityRef: cityRef,
        Page: String(page),
        Limit: WAREHOUSE_PAGE_SIZE,
        Language: "UA",
      });
    } catch (error) {
      if (!isTransientNpError(error)) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError;
}

async function loadCityWarehouses(cityRef: string): Promise<NpRow[]> {
  return cached(`warehouses:${cityRef}`, TTL.warehouses, async () => {
    const collected: NpRow[] = [];

    for (let page = 1; page <= MAX_WAREHOUSE_PAGES; page += 1) {
      if (page > 1) {
        await sleep(WAREHOUSE_PAGE_DELAY_MS);
      }

      let chunk: NpRow[];
      try {
        chunk = await fetchWarehousePage(cityRef, page);
      } catch (error) {
        if (collected.length > 0) {
          break;
        }
        throw error;
      }

      collected.push(...chunk);
      if (chunk.length < Number(WAREHOUSE_PAGE_SIZE)) {
        break;
      }
    }

    return collected;
  });
}

function isPostamatRow(row: NpRow, postamatRefs: Set<string>): boolean {
  const typeRef = text(row.TypeOfWarehouse);
  if (typeRef && postamatRefs.has(typeRef)) {
    return true;
  }
  const haystack = `${text(row.Description)} ${text(row.CategoryOfWarehouse)} ${text(
    row.PostMachineType,
  )}`.toLowerCase();
  return haystack.includes("поштомат") || haystack.includes("postamat");
}

function isSelectable(row: NpRow): boolean {
  return text(row.DenyToSelect).toLowerCase() !== "true";
}

function warehouseOption(row: NpRow, index: number): NpOption {
  const label = text(row.Description) || text(row.ShortAddress);
  const hint = text(row.ShortAddress);
  return {
    ref: uniqueRef("warehouse", index, text(row.Ref)),
    label,
    hint: hint && hint !== label ? hint : undefined,
  };
}

function rank(options: NpOption[], query: string): NpOption[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return options;
  }
  return [...options].sort((a, b) => {
    const aStarts = a.label.toLowerCase().startsWith(needle) ? 0 : 1;
    const bStarts = b.label.toLowerCase().startsWith(needle) ? 0 : 1;
    if (aStarts !== bStarts) {
      return aStarts - bStarts;
    }
    return a.label.localeCompare(b.label, "uk");
  });
}

export async function listWarehouses(
  cityRef: string,
  kind: WarehouseKind,
): Promise<NpOption[]> {
  if (!isNpRef(cityRef)) {
    return [];
  }

  const rows = await loadCityWarehouses(cityRef);
  const postamatRefs = new Set(await loadWarehouseTypeRefs());

  return uniqueByRef(
    rows
      .filter(isSelectable)
      .filter((row) => isPostamatRow(row, postamatRefs) === (kind === "postamat"))
      .map(warehouseOption)
      .filter((option) => option.label),
  );
}

export async function searchWarehouses(
  cityRef: string,
  kind: WarehouseKind,
  query: string,
): Promise<NpOption[]> {
  const matched = await listWarehouses(cityRef, kind);

  const q = normalizeQuery(query);
  const filtered = q
    ? matched.filter((option) => {
        const haystack = `${option.label} ${option.hint ?? ""}`.toLowerCase();
        return haystack.includes(q.toLowerCase());
      })
    : matched;

  return rank(filtered, q).slice(0, 20);
}

export async function verifyWarehouse(
  cityRef: string,
  kind: WarehouseKind,
  warehouseRef: string,
): Promise<boolean | null> {
  if (!isNpRef(warehouseRef)) {
    return false;
  }

  const matched = await listWarehouses(cityRef, kind);
  if (matched.length === 0) {
    return null;
  }

  return matched.some((option) => option.ref === warehouseRef);
}

import { searchCatalog } from "@/lib/catalog";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  const products = await searchCatalog(query);

  return Response.json({
    query,
    results: products.slice(0, 6).map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? null,
      art: product.art ?? null,
      weight: product.weight,
      availability: product.availability,
    })),
  });
}

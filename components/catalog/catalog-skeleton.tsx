import { Skeleton } from "@/components/ui/skeleton";

export function CatalogSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8">
      <aside className="hidden lg:block">
        <div className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </aside>

      <div>
        <div className="flex items-center justify-between border-b border-border pb-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="border border-border bg-paper p-4">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="mt-4 h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
              <Skeleton className="mt-4 h-7 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

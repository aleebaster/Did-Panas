"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

const AUTOPLAY_INTERVAL = 4000;
const RESUME_DELAY = 6000;
const DRAG_THRESHOLD = 6;
const CLICK_GUARD = 300;

export interface ProductCarouselConfig {
  title: string;
  subtitle: string;
  autoplay: boolean;
  autoplayInterval: number;
  showArrows: boolean;
}

const DEFAULT_CONFIG: ProductCarouselConfig = {
  title: "Наші товари",
  subtitle: "Обирай своє з колекції DID PANAS",
  autoplay: true,
  autoplayInterval: AUTOPLAY_INTERVAL,
  showArrows: true,
};

interface ProductCarouselProps {
  products: Product[];
  config?: Partial<ProductCarouselConfig>;
}

function capturePointer(track: HTMLDivElement, pointerId: number) {
  try {
    track.setPointerCapture(pointerId);
    return true;
  } catch {
    return false;
  }
}

export function ProductCarousel({ products, config }: ProductCarouselProps) {
  const { title, subtitle, autoplay, autoplayInterval, showArrows } = {
    ...DEFAULT_CONFIG,
    ...config,
  };
  const intervalMs =
    Number.isFinite(autoplayInterval) && autoplayInterval > 0
      ? Math.min(20000, Math.max(1000, Math.round(autoplayInterval)))
      : AUTOPLAY_INTERVAL;

  const trackRef = useRef<HTMLDivElement | null>(null);
  const interactionTimer = useRef<number | null>(null);
  const syncFrame = useRef<number | null>(null);
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startScroll: 0,
    moved: false,
  });
  const suppressClickRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const syncScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    setCanScroll(track.scrollWidth - track.clientWidth > 4);
  }, []);

  useEffect(() => {
    syncScrollState();
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const observer = new ResizeObserver(() => syncScrollState());
    observer.observe(track);
    return () => observer.disconnect();
  }, [syncScrollState]);

  const syncActiveIndex = useCallback(() => {
    if (syncFrame.current !== null) {
      return;
    }
    syncFrame.current = window.requestAnimationFrame(() => {
      syncFrame.current = null;
      const track = trackRef.current;
      if (!track) {
        return;
      }
      let closest = 0;
      let closestDelta = Number.POSITIVE_INFINITY;
      for (let index = 0; index < track.children.length; index += 1) {
        const card = track.children[index] as HTMLElement;
        const delta = Math.abs(card.offsetLeft - track.scrollLeft);
        if (delta < closestDelta) {
          closestDelta = delta;
          closest = index;
        }
      }
      setActiveIndex(closest);
    });
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) {
        return;
      }
      const card = track.children[
        Math.max(0, Math.min(index, track.children.length - 1))
      ] as HTMLElement | undefined;
      if (!card) {
        return;
      }
      track.scrollTo({
        left: card.offsetLeft,
        behavior: reducedMotion ? "auto" : "smooth",
      });
    },
    [reducedMotion],
  );

  const pauseInteraction = useCallback(() => {
    setInteracting(true);
    if (interactionTimer.current !== null) {
      window.clearTimeout(interactionTimer.current);
    }
    interactionTimer.current = window.setTimeout(() => {
      interactionTimer.current = null;
      setInteracting(false);
    }, RESUME_DELAY);
  }, []);

  const endDrag = useCallback(
    (pointerId: number) => {
      const drag = dragRef.current;
      const track = trackRef.current;
      if (!drag.active || drag.pointerId !== pointerId) {
        return;
      }
      drag.active = false;
      if (track) {
        if (track.hasPointerCapture(pointerId)) {
          track.releasePointerCapture(pointerId);
        }
        track.style.scrollBehavior = "";
      }
      if (drag.moved) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, CLICK_GUARD);
        setDragging(false);
        syncActiveIndex();
      }
      window.setTimeout(() => {
        dragRef.current.moved = false;
      }, 0);
    },
    [syncActiveIndex],
  );

  useEffect(() => {
    const handleRelease = (event: globalThis.PointerEvent) => {
      endDrag(event.pointerId);
    };
    window.addEventListener("pointerup", handleRelease);
    window.addEventListener("pointercancel", handleRelease);
    return () => {
      window.removeEventListener("pointerup", handleRelease);
      window.removeEventListener("pointercancel", handleRelease);
      if (syncFrame.current !== null) {
        window.cancelAnimationFrame(syncFrame.current);
      }
      if (interactionTimer.current !== null) {
        window.clearTimeout(interactionTimer.current);
      }
    };
  }, [endDrag]);

  const paused = hovering || interacting || reducedMotion || !canScroll;

  useEffect(() => {
    if (!autoplay || paused || products.length < 2) {
      return;
    }
    const timer = window.setTimeout(() => {
      const next = activeIndex + 1 >= products.length ? 0 : activeIndex + 1;
      scrollToIndex(next);
    }, intervalMs);
    return () => window.clearTimeout(timer);
  }, [activeIndex, autoplay, intervalMs, paused, products.length, scrollToIndex]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }
    const track = trackRef.current;
    if (!track) {
      return;
    }
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startScroll: track.scrollLeft,
      moved: false,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const track = trackRef.current;
    if (!drag.active || !track || event.pointerId !== drag.pointerId) {
      return;
    }
    const delta = event.clientX - drag.startX;
    if (!drag.moved && Math.abs(delta) < DRAG_THRESHOLD) {
      return;
    }
    if (!drag.moved) {
      drag.moved = true;
      setDragging(true);
      pauseInteraction();
      track.style.scrollBehavior = "auto";
      capturePointer(track, event.pointerId);
    }
    track.scrollLeft = drag.startScroll - delta;
    syncActiveIndex();
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    endDrag(event.pointerId);
  };

  const handleClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
    }
  };

  if (products.length === 0) {
    return null;
  }

  const last = products.length - 1;

  const step = (direction: 1 | -1) => {
    const next = activeIndex + direction;
    pauseInteraction();
    scrollToIndex(next < 0 ? last : next > last ? 0 : next);
  };

  return (
    <section
      data-testid="products-carousel"
      aria-labelledby="products-carousel-title"
      className="container-page pb-14 lg:pb-20"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="products-carousel-title" className="heading-lg">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>

        {showArrows ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Назад"
              onClick={() => step(-1)}
              className="grid size-10 place-items-center border border-border bg-paper text-ink transition hover:border-ink/40 hover:bg-ink hover:text-cream"
            >
              <ArrowLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Далі"
              onClick={() => step(1)}
              className="grid size-10 place-items-center border border-border bg-paper text-ink transition hover:border-ink/40 hover:bg-ink hover:text-cream"
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        ) : null}
      </div>

      <div
        ref={trackRef}
        data-testid="carousel-track"
        className={cn(
          "relative mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          dragging && "cursor-grabbing select-none",
        )}
        onScroll={syncActiveIndex}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={handleClickCapture}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="w-[70%] shrink-0 snap-start sm:w-[45%] md:w-[calc((100%_-_2rem)/3)] lg:w-[calc((100%_-_3rem)/4)]"
          >
            <ProductCard
              product={product}
              className="h-full"
              sizes="(max-width: 639px) 70vw, (max-width: 767px) 45vw, (max-width: 1023px) 33vw, 320px"
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {products.map((product, index) => (
          <button
            key={product.id}
            type="button"
            aria-label={`Позиція ${index + 1} з ${products.length}`}
            aria-current={index === activeIndex ? "true" : undefined}
            onClick={() => {
              pauseInteraction();
              scrollToIndex(index);
            }}
            className={cn(
              "h-2 rounded-full transition-all",
              index === activeIndex ? "w-6 bg-brick" : "w-2 bg-ink/20",
            )}
          />
        ))}
      </div>
    </section>
  );
}

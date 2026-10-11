export type ProductBadge =
  | "new"
  | "hit"
  | "sale"
  | "few"
  | "out"
  | "bestseller"
  | "";

export type Availability = "in-stock" | "low-stock" | "preorder" | "out-of-stock";

export interface ProductArt {
  background: string;
  accent: string;
  icon: "pouch" | "box" | "jar" | "bag" | "shirt" | "cup";
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  categoryId: string;
  images: string[];
  art?: ProductArt | null;
  weight: string;
  stock: number;
  availability: Availability;
  badge?: ProductBadge;
  featured: boolean;
  ingredients?: string;
  origin?: string;
  sku: string;
  createdAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image?: string | null;
  art?: ProductArt | null;
  order: number;
}

export interface BannerImages {
  desktop: string | null;
  tablet: string | null;
  mobile: string | null;
}

export type BannerPosition = "hero" | "promo" | "strip";

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  position: BannerPosition;
  images: BannerImages;
  accent: string;
  active: boolean;
  order: number;
}

export type OrderStatus =
  | "new"
  | "confirmed"
  | "paid"
  | "shipped"
  | "completed"
  | "cancelled";

export interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email: string;
  city: string;
  address?: string;
  warehouse?: string;
  delivery: string;
  payment: string;
  comment: string;
}

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  status: OrderStatus;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  workingHours: string;
  instagram: string;
  facebook: string;
  telegram: string;
  freeShippingThreshold: number;
  shippingCost: number;
  legalNote: string;
}

export interface HomeCarouselSettings {
  title: string;
  subtitle: string;
  enabled: boolean;
  autoplay: boolean;
  autoplayInterval: number;
  showArrows: boolean;
}

export interface HomeCarouselItem {
  id: string;
  productId: string;
  image: string | null;
  name: string;
  description: string;
  order: number;
  active: boolean;
}

export interface HomeCarousel {
  settings: HomeCarouselSettings;
  items: HomeCarouselItem[];
}

export interface DatabaseShape {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  orders: Order[];
  settings: StoreSettings;
  homeCarousel: HomeCarousel;
}

export type SortKey = "popular" | "price-asc" | "price-desc" | "new";

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  art: ProductArt | null;
  weight: string;
  quantity: number;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Нове",
  confirmed: "Підтверджено",
  paid: "Оплачено",
  shipped: "Відправлено",
  completed: "Виконано",
  cancelled: "Скасовано",
};

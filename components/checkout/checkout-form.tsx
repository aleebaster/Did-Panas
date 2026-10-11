"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";

import { useCart } from "@/components/cart/cart-provider";
import { Autocomplete } from "@/components/checkout/autocomplete";
import { ProductArt } from "@/components/product/product-media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  DELIVERY_OPTIONS,
  PAYMENT_OPTIONS,
  isPickup,
  needsCity,
  needsStreet,
  needsWarehouse,
} from "@/lib/checkout";
import { createOrderAction, type CheckoutState } from "@/lib/actions/orders";
import { formatPrice } from "@/lib/format";
import type { StoreSettings } from "@/types";

const initialState: CheckoutState = { ok: false, error: null };

export function CheckoutForm({ settings }: { settings: StoreSettings }) {
  const router = useRouter();
  const { lines, subtotal, clear } = useCart();
  const [state, formAction, pending] = useActionState(
    createOrderAction,
    initialState,
  );

  const [delivery, setDelivery] = useState(DELIVERY_OPTIONS[0].value);
  const [city, setCity] = useState("");
  const [cityRef, setCityRef] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [warehouseRef, setWarehouseRef] = useState("");
  const [street, setStreet] = useState("");
  const [streetRef, setStreetRef] = useState("");
  const [building, setBuilding] = useState("");
  const [flat, setFlat] = useState("");

  const pickup = isPickup(delivery);
  const showWarehouse = needsWarehouse(delivery);
  const showStreet = needsStreet(delivery);
  const showCity = needsCity(delivery);
  const postamat = delivery === "nova-poshta-postamat";

  const fields = state.fields ?? {};

  const shipping =
    pickup || subtotal >= settings.freeShippingThreshold
      ? 0
      : settings.shippingCost;

  useEffect(() => {
    if (state.ok && state.orderId) {
      clear();
      router.push(`/order/${state.orderId}`);
    }
  }, [state, clear, router]);

  function handleDeliveryChange(value: string) {
    setDelivery(value);
    setWarehouse("");
    setWarehouseRef("");
    setStreet("");
    setStreetRef("");
    setBuilding("");
    setFlat("");
    if (isPickup(value)) {
      setCity("");
      setCityRef("");
    }
  }

  function handleCitySelect(suggestion: { ref: string; label: string }) {
    setCity(suggestion.label);
    setCityRef(suggestion.ref);
    setWarehouse("");
    setWarehouseRef("");
    setStreet("");
    setStreetRef("");
  }

  if (lines.length === 0) {
    return (
      <div className="mt-10 border border-dashed border-border bg-paper px-6 py-16 text-center">
        <h2 className="heading-md">Немає що оформлювати</h2>
        <p className="mt-2 text-muted-foreground">
          Ваш кошик порожній. Спершу додайте товари.
        </p>
        <Button asChild className="mt-6">
          <Link href="/catalog">До каталогу</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]"
    >
      <input type="hidden" name="cart" value={JSON.stringify(lines)} />
      <input type="hidden" name="cityRef" value={cityRef} />
      <input type="hidden" name="warehouseRef" value={warehouseRef} />
      <input type="hidden" name="streetRef" value={streetRef} />

      <div className="space-y-8">
        <section>
          <h2 className="font-display text-sm font-semibold tracking-[0.16em] uppercase">
            Контактні дані
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Імʼя та прізвище *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Олена Коваль"
                aria-invalid={Boolean(fields.name)}
              />
              {fields.name && (
                <p role="alert" className="text-xs text-brick">
                  {fields.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="+380 __ ___ __ __"
                aria-invalid={Boolean(fields.phone)}
              />
              {fields.phone && (
                <p role="alert" className="text-xs text-brick">
                  {fields.phone}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(fields.email)}
              />
              {fields.email && (
                <p role="alert" className="text-xs text-brick">
                  {fields.email}
                </p>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-sm font-semibold tracking-[0.16em] uppercase">
            Доставка
          </h2>
          <RadioGroup
            name="delivery"
            value={delivery}
            onValueChange={handleDeliveryChange}
            className="mt-4 grid gap-2"
          >
            {DELIVERY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 border border-border bg-paper px-4 py-3 text-sm transition has-[[data-state=checked]]:border-ink has-[[data-state=checked]]:bg-cream"
              >
                <RadioGroupItem value={option.value} id={`d-${option.value}`} />
                <span className="flex-1">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.value === "pickup" || shipping === 0
                    ? "безкоштовно"
                    : formatPrice(shipping)}
                </span>
              </label>
            ))}
          </RadioGroup>

          {pickup ? (
            <div className="mt-5 border-t border-border pt-5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {settings.address}
              </p>
              <p className="mt-1">{settings.workingHours}</p>
              <p className="mt-1">
                Очікуємо вас за вказаною адресою — підтвердимо час у телефонному
                режимі.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
              {showCity && (
                <Autocomplete
                  id="city"
                  name="city"
                  label="Місто або населений пункт"
                  required
                  value={city}
                  endpoint="/api/nova-poshta/settlements"
                  placeholder="Львів"
                  error={fields.city}
                  onChange={setCity}
                  onSelect={handleCitySelect}
                />
              )}

              {showWarehouse && (
                <Autocomplete
                  id="warehouse"
                  name="warehouse"
                  label={postamat ? "Поштомат" : "Відділення Нової пошти"}
                  required
                  ready={Boolean(cityRef)}
                  value={warehouse}
                  endpoint="/api/nova-poshta/warehouses"
                  params={{ cityRef, kind: postamat ? "postamat" : "department" }}
                  placeholder="Номер або адреса"
                  error={fields.warehouse}
                  onChange={(value) => {
                    setWarehouse(value);
                    setWarehouseRef("");
                  }}
                  onSelect={(suggestion) => {
                    setWarehouse(suggestion.label);
                    setWarehouseRef(suggestion.ref);
                  }}
                />
              )}

              {showStreet && (
                <>
                  <Autocomplete
                    id="street"
                    name="street"
                    label="Вулиця"
                    required
                    ready={Boolean(cityRef)}
                    value={street}
                    endpoint="/api/nova-poshta/streets"
                    params={{ cityRef }}
                    placeholder="вул. Хрещатик"
                    error={fields.street}
                    onChange={(value) => {
                      setStreet(value);
                      setStreetRef("");
                    }}
                    onSelect={(suggestion) => {
                      setStreet(suggestion.label);
                      setStreetRef(suggestion.ref);
                    }}
                  />
                  <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="building">Будинок *</Label>
                      <Input
                        id="building"
                        name="building"
                        required
                        value={building}
                        onChange={(event) => setBuilding(event.target.value)}
                        placeholder="12"
                        aria-invalid={Boolean(fields.building)}
                      />
                      {fields.building && (
                        <p role="alert" className="text-xs text-brick">
                          {fields.building}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="flat">Квартира / офіс</Label>
                      <Input
                        id="flat"
                        name="flat"
                        value={flat}
                        onChange={(event) => setFlat(event.target.value)}
                        placeholder="5"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-sm font-semibold tracking-[0.16em] uppercase">
            Оплата
          </h2>
          <RadioGroup
            name="payment"
            defaultValue={PAYMENT_OPTIONS[0].value}
            className="mt-4 grid gap-2"
          >
            {PAYMENT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 border border-border bg-paper px-4 py-3 text-sm transition has-[[data-state=checked]]:border-ink has-[[data-state=checked]]:bg-cream"
              >
                <RadioGroupItem value={option.value} id={`p-${option.value}`} />
                <span>{option.label}</span>
              </label>
            ))}
          </RadioGroup>
          {fields.payment && (
            <p role="alert" className="mt-2 text-xs text-brick">
              {fields.payment}
            </p>
          )}
        </section>

        <section className="space-y-2">
          <Label htmlFor="comment">Коментар до замовлення</Label>
          <Textarea
            id="comment"
            name="comment"
            rows={3}
            placeholder="Наприклад: бажана дата відправлення, побажання до пакування"
          />
        </section>

        {state.error && (
          <p
            role="alert"
            className="flex items-start gap-2 border border-brick/40 bg-brick/10 px-4 py-3 text-sm text-brick"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {state.error}
          </p>
        )}
      </div>

      <aside className="h-fit border border-border bg-cream p-5">
        <h2 className="font-display text-sm font-semibold tracking-[0.16em] uppercase">
          Ваше замовлення
        </h2>

        <ul className="mt-4 space-y-3">
          {lines.map((line) => (
            <li key={line.productId} className="flex gap-3">
              <span className="relative size-12 shrink-0 overflow-hidden border border-border bg-paper">
                {line.image ? (
                  <Image
                    src={line.image}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <ProductArt art={line.art} name={line.name} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {line.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {line.weight} · ×{line.quantity}
                </span>
              </span>
              <span className="text-sm font-medium">
                {formatPrice(line.price * line.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <Separator className="my-4" />

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Товари</dt>
            <dd className="font-medium">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Доставка</dt>
            <dd className="font-medium">
              {shipping === 0 ? "безкоштовно" : formatPrice(shipping)}
            </dd>
          </div>
        </dl>

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <span className="font-display text-sm font-semibold uppercase">Разом</span>
          <span className="font-display text-2xl font-semibold">
            {formatPrice(subtotal + shipping)}
          </span>
        </div>

        <Button
          type="submit"
          size="lg"
          className="btn-vintage mt-5 h-11 w-full"
          disabled={pending}
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {pending ? "Оформлюємо…" : "Підтвердити замовлення"}
        </Button>

        <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 text-brick" />
          Дані використовуються лише для обробки замовлення.
        </p>
      </aside>
    </form>
  );
}

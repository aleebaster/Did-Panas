export interface DeliveryOption {
  value: string;
  label: string;
  kind: "department" | "postamat" | "courier" | "pickup";
}

export interface PaymentOption {
  value: string;
  label: string;
}

export const DELIVERY_OPTIONS: DeliveryOption[] = [
  { value: "nova-poshta", label: "Нова пошта — відділення", kind: "department" },
  { value: "nova-poshta-postamat", label: "Нова пошта — поштомат", kind: "postamat" },
  { value: "courier", label: "Курʼєр Нової пошти", kind: "courier" },
  { value: "pickup", label: "Самовивіз з майстерні", kind: "pickup" },
];

export const PAYMENT_OPTIONS: PaymentOption[] = [
  { value: "cod", label: "Оплата при отриманні" },
  { value: "card", label: "Оплата карткою онлайн" },
  { value: "invoice", label: "Безготівковий розрахунок" },
];

export function getDeliveryOption(value: string): DeliveryOption | null {
  return DELIVERY_OPTIONS.find((option) => option.value === value) ?? null;
}

export function getPaymentOption(value: string): PaymentOption | null {
  return PAYMENT_OPTIONS.find((option) => option.value === value) ?? null;
}

export function deliveryLabel(value: string): string {
  return getDeliveryOption(value)?.label ?? value;
}

export function paymentLabel(value: string): string {
  return getPaymentOption(value)?.label ?? value;
}

export function isPickup(value: string): boolean {
  return getDeliveryOption(value)?.kind === "pickup";
}

export function isPickupPoint(value: string): boolean {
  const kind = getDeliveryOption(value)?.kind;
  return kind === "department" || kind === "postamat";
}

export function isCourier(value: string): boolean {
  return getDeliveryOption(value)?.kind === "courier";
}

export function needsCity(value: string): boolean {
  return !isPickup(value);
}

export function needsWarehouse(value: string): boolean {
  return isPickupPoint(value);
}

export function needsStreet(value: string): boolean {
  return isCourier(value);
}

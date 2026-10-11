const priceFormatter = new Intl.NumberFormat("uk-UA", {
  maximumFractionDigits: 0,
});

const priceSpacePattern = /[   ]/g;
const priceSeparator = " ";
const priceCurrency = "грн";

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("uk-UA", {
  dateStyle: "medium",
});

export function formatPrice(value: number): string {
  const amount = priceFormatter.format(value).replace(priceSpacePattern, priceSeparator);
  return `${amount}${priceSeparator}${priceCurrency}`;
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

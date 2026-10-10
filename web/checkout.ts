import { cartTotal, cartWeight, payable, type WeightedCartLine } from "../src/cart.js";
import { type Coupon, discountFor } from "../src/coupon.js";
import { Money } from "../src/money.js";
import { type Order, orderTotal } from "../src/report.js";
import { isCalendarDate, quoteShipping, type ShippingMethod, type ShippingQuote } from "../src/shipping.js";

/** What the shop sells to everyone who opens the checkout: made-up products, prices and weights. */
const CART: { name: string; line: WeightedCartLine }[] = [
  {
    name: "Mechanical keyboard",
    line: { productCode: "KB-87", unitPrice: Money.fromBRL("899,90"), quantity: 1, unitWeightKg: 1 },
  },
  {
    name: "USB-C cable, 2 m",
    line: { productCode: "USBC-2", unitPrice: Money.fromBRL("49,90"), quantity: 2, unitWeightKg: 0.1 },
  },
  {
    name: "Desk mat",
    line: { productCode: "MAT-90", unitPrice: Money.fromBRL("129,00"), quantity: 1, unitWeightKg: 0.8 },
  },
];

/** Made-up coupons the shop accepts; codes are matched in upper case. */
const COUPONS: Coupon[] = [
  { code: "WELCOME10", kind: "percent", percent: 10, expiresAt: new Date("2099-12-31T23:59:59Z") },
  { code: "SAVE50", kind: "fixed", amount: Money.fromBRL("50,00"), expiresAt: new Date("2099-12-31T23:59:59Z") },
  { code: "FREESHIP", kind: "free-shipping", expiresAt: new Date("2099-12-31T23:59:59Z") },
  { code: "OLD5", kind: "fixed", amount: Money.fromBRL("5,00"), expiresAt: new Date("2020-01-01T00:00:00Z") },
];

const METHODS: ShippingMethod[] = ["standard", "express", "scheduled"];
const METHOD_NAMES: Record<ShippingMethod, string> = { standard: "Standard", express: "Express", scheduled: "Scheduled" };
const DAY_MS = 24 * 60 * 60 * 1000;

const lines = document.querySelector<HTMLUListElement>("#lines")!;
const total = document.querySelector<HTMLParagraphElement>("#total")!;
const shipping = document.querySelector<HTMLParagraphElement>("#free-shipping")!;
const pay = document.querySelector<HTMLButtonElement>("#pay")!;
const form = document.querySelector<HTMLFormElement>("#shipping")!;
const dateInput = document.querySelector<HTMLInputElement>("#delivery-date")!;
const dateError = document.querySelector<HTMLParagraphElement>("#date-error")!;
const placed = document.querySelector<HTMLParagraphElement>("#placed")!;
const deliveryDetails = document.querySelector<HTMLParagraphElement>("#delivery-details")!;
const couponForm = document.querySelector<HTMLFormElement>("#coupon")!;
const couponInput = document.querySelector<HTMLInputElement>("#coupon-code")!;
const couponError = document.querySelector<HTMLParagraphElement>("#coupon-error")!;
const discountLine = document.querySelector<HTMLParagraphElement>("#discount")!;

for (const { name, line } of CART) {
  const item = document.createElement("li");
  const label = document.createElement("span");
  label.textContent = line.quantity > 1 ? `${name} × ${line.quantity}` : name;
  const price = document.createElement("span");
  price.className = "price";
  price.textContent = line.unitPrice.multiplyBy(line.quantity).toBRL();
  item.append(label, price);
  lines.append(item);
}

const cart = CART.map((c) => c.line);
const subtotal = cartTotal(cart);
const weightKg = cartWeight(cart);
let method: ShippingMethod = "standard";
let applied: Coupon | undefined;
let discount = new Money(0);
let order: Order | undefined;

/** The UTC calendar date `days` days after `now`. */
function utcDate(now: Date, days: number): string {
  return new Date(now.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** The typed delivery date when it is a real date after today's UTC date, else undefined. */
function acceptedDate(now: Date): string | undefined {
  const typed = dateInput.value;
  return isCalendarDate(typed) && typed > utcDate(now, 0) ? typed : undefined;
}

/** Quotes a method. Scheduled uses tomorrow as a preview while the typed date is missing or not accepted. */
function quoteFor(option: ShippingMethod, now: Date): ShippingQuote {
  return quoteShipping(
    { method: option, subtotal, weightKg, coupon: applied, deliveryDate: acceptedDate(now) ?? utcDate(now, 1) },
    now,
  );
}

/** The validation message for the delivery date, empty when none is needed. */
function dateMessage(now: Date): string {
  if (method !== "scheduled" || acceptedDate(now) !== undefined) {
    return "";
  }
  return dateInput.value === "" ? "Choose a delivery date." : "Choose a date after today (UTC).";
}

/** The delivery estimate shown on an option: business days, or the chosen date for scheduled. */
function windowOf(quote: ShippingQuote): string {
  return quote.businessDays
    ? `${quote.businessDays.min}–${quote.businessDays.max} business days`
    : "On the date you choose";
}

function render(now: Date = new Date()): void {
  const message = dateMessage(now);
  dateInput.min = utcDate(now, 1);
  dateInput.disabled = method !== "scheduled";
  dateInput.required = method === "scheduled";
  dateInput.setCustomValidity(message);
  dateInput.setAttribute("aria-invalid", String(message !== ""));
  dateError.textContent = message;

  for (const option of METHODS) {
    const quote = quoteFor(option, now);
    document.querySelector(`#${option}-window`)!.textContent = windowOf(quote);
    document.querySelector(`#${option}-price`)!.textContent = quote.cost.toBRL();
  }

  const selected = quoteFor(method, now);
  const amount = payable(cart, discount).add(selected.cost);
  total.textContent = `Total: ${amount.toBRL()}`;
  shipping.textContent = selected.cost.cents === 0 ? "Free shipping" : `Shipping: ${selected.cost.toBRL()}`;
  shipping.classList.toggle("badge", selected.cost.cents === 0);
  pay.textContent = `Place order and pay ${amount.toBRL()}`;
}

render();

couponForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = couponInput.value.trim().toUpperCase();
  const coupon = COUPONS.find((c) => c.code === code);
  if (!coupon) {
    couponError.textContent = `Unknown coupon code: ${code}`;
    return;
  }
  try {
    discount = discountFor(coupon, subtotal, new Date());
  } catch (error) {
    couponError.textContent = error instanceof Error ? error.message : String(error);
    return;
  }
  applied = coupon;
  couponError.textContent = "";
  discountLine.textContent =
    coupon.kind === "free-shipping"
      ? `Coupon ${coupon.code}: free shipping`
      : `Coupon ${coupon.code}: -${discount.toBRL()}`;
  discountLine.hidden = false;
  render();
});

form.addEventListener("change", () => {
  method = METHODS.find((option) => option === new FormData(form).get("method")) ?? method;
  render();
});

dateInput.addEventListener("input", () => render());

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (order) {
    return;
  }
  const now = new Date();
  render(now);
  if (!form.reportValidity()) {
    return;
  }
  const quote = quoteFor(method, now);
  const delivery = { method, cost: quote.cost, deliveryDate: quote.deliveryDate };
  order = { id: crypto.randomUUID(), lines: cart, discount, shipping: delivery };
  pay.disabled = true;
  placed.textContent = "Order placed. You will get an email with the tracking code.";
  const date = delivery.deliveryDate ? ` for ${delivery.deliveryDate}` : "";
  deliveryDetails.textContent = `Delivery: ${METHOD_NAMES[delivery.method]}${date}. Shipping: ${delivery.cost.toBRL()}. Total: ${orderTotal(order).toBRL()}.`;
  deliveryDetails.hidden = false;
});

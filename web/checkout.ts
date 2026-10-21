import { cartQuantity, cartTotal, cartWeight, payable, type WeightedCartLine } from "../src/cart.js";
import { type Coupon, discountFor } from "../src/coupon.js";
import { pointsCoupon, pointsEarned } from "../src/loyalty.js";
import { Money } from "../src/money.js";
import { ORDER_NUMBER_LENGTH, ORDER_NUMBER_PATTERN, orderNumberFrom } from "../src/order-number.js";
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

/** Made-up demo account and balance for loyalty points; checkout has no sign-in, so the balance starts at DEMO_POINTS and, once an order is placed, is kept in this browser with that order. */
const DEMO_USER_ID = "demo-user";
const DEMO_POINTS = 1000;
const POINTS_EXPIRES_AT = new Date("2099-12-31T23:59:59Z");

/** Where this browser keeps the placed order, so a reload shows it again with the same order number. */
const ORDER_KEY = "sandbox-shop:placed-order";

/** Where this browser keeps an unplaced discount, so a reload applies it again. */
const DISCOUNT_KEY = "sandbox-shop:pending-discount";

/**
 * The captured fields of a placed order, the points balance after it, and the discount line it showed, as kept under ORDER_KEY.
 * Records saved before the balance was kept have no balanceAfter; they restore with the demo balance.
 */
interface SavedOrder {
  number: string;
  method: ShippingMethod;
  deliveryDate?: string;
  costCents: number;
  totalCents: number;
  balanceAfter?: number;
  discountLabel?: string;
}

/** An unplaced discount as kept under DISCOUNT_KEY: a coupon code, or the points redeemed. */
type PendingDiscount = { code: string } | { points: number };

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
const expiryLine = document.createElement("p");
expiryLine.id = "coupon-expiry";
expiryLine.className = "discount";
expiryLine.hidden = true;
discountLine.after(expiryLine);
const pointsBalance = document.querySelector<HTMLParagraphElement>("#points-balance")!;
const redeemButton = document.querySelector<HTMLButtonElement>("#redeem-points")!;
const pointsEarnedLine = document.querySelector<HTMLParagraphElement>("#points-earned")!;

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

let cart = CART.map((c) => c.line);
let subtotal = cartTotal(cart);
let weightKg = cartWeight(cart);
const productCount = document.createElement("p");
productCount.id = "product-count";
total.before(productCount);
const itemCount = document.createElement("p");
itemCount.className = "item-count";
total.after(itemCount);
const clearCart = document.createElement("a");
clearCart.id = "clear-cart";
clearCart.href = "#";
clearCart.textContent = "Clear cart";
itemCount.after(clearCart);
showCartCounts();
let method: ShippingMethod = "standard";
let applied: Coupon | undefined;
let discount = new Money(0);
let orderNumber: string | undefined;
let balance = DEMO_POINTS;
let pointsSpent = 0;

/** Shows the product count and the item count of the cart, and hides the coupon box when the cart is empty. */
function showCartCounts(): void {
  productCount.textContent = `Products in cart: ${new Set(cart.map((line) => line.productCode)).size}`;
  const quantity = cartQuantity(cart);
  itemCount.textContent = `${quantity} ${quantity === 1 ? "item" : "items"}`;
  couponForm.style.display = cart.length === 0 ? "none" : "";
}

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

/** Moves the delivery options into ascending price order, leaving them as they are when already in that order so the focused radio is not detached. */
function orderCheapestFirst(quoted: { option: ShippingMethod; quote: ShippingQuote }[]): void {
  const fieldset = document.querySelector<HTMLFieldSetElement>(".delivery")!;
  const labels = [...quoted]
    .sort((a, b) => a.quote.cost.cents - b.quote.cost.cents)
    .map(({ option }) => document.querySelector<HTMLInputElement>(`input[name="method"][value="${option}"]`)!.closest("label")!);
  const current = [...fieldset.querySelectorAll(".option")];
  if (labels.some((label, index) => label !== current[index])) {
    fieldset.append(...labels);
  }
}

function render(now: Date = new Date()): void {
  const message = dateMessage(now);
  dateInput.min = utcDate(now, 1);
  dateInput.disabled = method !== "scheduled";
  dateInput.required = method === "scheduled";
  dateInput.setCustomValidity(message);
  dateInput.setAttribute("aria-invalid", String(message !== ""));
  dateError.textContent = message;

  const quoted = METHODS.map((option) => ({ option, quote: quoteFor(option, now) }));
  for (const { option, quote } of quoted) {
    document.querySelector(`#${option}-window`)!.textContent = windowOf(quote);
    document.querySelector(`#${option}-price`)!.textContent = quote.cost.toBRL();
  }
  orderCheapestFirst(quoted);

  const selected = quoteFor(method, now);
  const amount = payable(cart, discount).add(selected.cost);
  total.textContent = `Total do pedido: ${amount.toBRL()}`;
  shipping.textContent = selected.cost.cents === 0 ? "Free shipping" : `Shipping: ${selected.cost.toBRL()}`;
  shipping.classList.toggle("badge", selected.cost.cents === 0);
  pay.textContent = `Place order and pay ${amount.toBRL()}`;
}

/** Disables the delivery, coupon and points controls once the order is captured, so the total keeps matching the captured order. */
function lockAfterCapture(): void {
  document
    .querySelectorAll<HTMLInputElement | HTMLButtonElement>(
      'input[name="method"], #delivery-date, #coupon input, #coupon button, #redeem-points',
    )
    .forEach((control) => {
      control.disabled = true;
    });
}

/** Shows the points balance; redeeming is off when nothing is left to redeem. */
function renderPoints(): void {
  pointsBalance.textContent = `Points balance: ${balance}`;
  redeemButton.disabled = balance === 0;
}

/** Puts a coupon in the one discount slot, replacing any earlier coupon or points redemption. @throws {Error} When the coupon is refused. */
function applyDiscount(coupon: Coupon): void {
  discount = discountFor(coupon, subtotal, new Date());
  applied = coupon;
  pointsSpent = 0;
  couponError.textContent = "";
  discountLine.textContent =
    coupon.kind === "free-shipping"
      ? `Coupon ${coupon.code}: free shipping`
      : `Coupon ${coupon.code}: -${discount.toBRL()}`;
  discountLine.hidden = false;
  expiryLine.textContent = `Expires ${coupon.expiresAt.toISOString().slice(0, 10)}`;
  expiryLine.hidden = false;
  render();
}

/** The placed order kept under ORDER_KEY, or undefined when none is kept or the stored value is malformed. */
function savedOrderOf(raw: string | null): SavedOrder | undefined {
  let saved: Partial<SavedOrder> | null;
  try {
    saved = JSON.parse(raw ?? "null");
  } catch {
    return undefined;
  }
  if (
    typeof saved?.number !== "string" ||
    !ORDER_NUMBER_PATTERN.test(saved.number) ||
    !METHODS.some((option) => option === saved.method) ||
    (saved.deliveryDate !== undefined && typeof saved.deliveryDate !== "string") ||
    !Number.isInteger(saved.costCents) ||
    saved.totalCents === undefined ||
    !Number.isInteger(saved.totalCents) ||
    saved.totalCents < 0 ||
    (saved.balanceAfter !== undefined &&
      (typeof saved.balanceAfter !== "number" || !Number.isInteger(saved.balanceAfter) || saved.balanceAfter < 0)) ||
    (saved.discountLabel !== undefined && typeof saved.discountLabel !== "string")
  ) {
    return undefined;
  }
  return saved as SavedOrder;
}

/** The unplaced discount kept under DISCOUNT_KEY, or undefined when none is kept or the stored value is malformed. */
function pendingDiscountOf(raw: string | null): PendingDiscount | undefined {
  let saved: Partial<{ code: unknown; points: unknown }> | null;
  try {
    saved = JSON.parse(raw ?? "null");
  } catch {
    return undefined;
  }
  if (typeof saved?.code === "string") {
    return { code: saved.code };
  }
  if (Number.isInteger(saved?.points) && (saved?.points as number) > 0) {
    return { points: saved?.points as number };
  }
  return undefined;
}

/** Shows a placed order: its number in the confirmation and its delivery details, the discount it came from, and locks the controls so the captured order stays as it was. */
function showPlaced(saved: SavedOrder): void {
  pay.disabled = true;
  clearCart.hidden = true;
  pay.textContent = `Place order and pay ${new Money(saved.totalCents).toBRL()}`;
  lockAfterCapture();
  placed.textContent = `Order placed: ${saved.number}. You will get an email with the tracking code.`;
  pointsEarnedLine.textContent = `Points earned on this order: ${pointsEarned(new Money(saved.totalCents))}`;
  pointsEarnedLine.hidden = false;
  if (saved.discountLabel) {
    discountLine.textContent = saved.discountLabel;
    discountLine.hidden = false;
  }
  const date = saved.deliveryDate ? ` for ${saved.deliveryDate}` : "";
  deliveryDetails.textContent = `Delivery: ${METHOD_NAMES[saved.method]}${date}. Shipping: ${new Money(saved.costCents).toBRL()}. Total: ${new Money(saved.totalCents).toBRL()}.`;
  deliveryDetails.hidden = false;
}

/** Applies an unplaced discount kept from before the reload; a refused or unknown one is dropped from storage. */
function restoreDiscount(pending: PendingDiscount): void {
  try {
    if ("code" in pending) {
      const coupon = COUPONS.find((c) => c.code === pending.code);
      if (!coupon) {
        throw new Error(`Unknown coupon code: ${pending.code}`);
      }
      applyDiscount(coupon);
    } else {
      const points = Math.min(pending.points, balance, subtotal.cents);
      applyDiscount(pointsCoupon(points, POINTS_EXPIRES_AT));
      pointsSpent = points;
    }
  } catch {
    localStorage.removeItem(DISCOUNT_KEY);
  }
}

render();
renderPoints();

const restored = savedOrderOf(localStorage.getItem(ORDER_KEY));
if (restored) {
  orderNumber = restored.number;
  method = restored.method;
  dateInput.value = restored.deliveryDate ?? "";
  document.querySelector<HTMLInputElement>(`input[name="method"][value="${method}"]`)!.checked = true;
  balance = restored.balanceAfter ?? DEMO_POINTS;
  renderPoints();
  render();
  showPlaced(restored);
} else {
  const pending = pendingDiscountOf(localStorage.getItem(DISCOUNT_KEY));
  if (pending) {
    restoreDiscount(pending);
  } else {
    localStorage.removeItem(DISCOUNT_KEY);
  }
}

couponForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = couponInput.value.trim().toUpperCase();
  const coupon = COUPONS.find((c) => c.code === code);
  if (!coupon) {
    couponError.textContent = `Unknown coupon code: ${code}`;
    couponInput.focus();
    return;
  }
  try {
    applyDiscount(coupon);
    localStorage.setItem(DISCOUNT_KEY, JSON.stringify({ code: coupon.code }));
  } catch (error) {
    couponError.textContent = error instanceof Error ? error.message : String(error);
    couponInput.focus();
  }
});

redeemButton.addEventListener("click", () => {
  const points = Math.min(balance, subtotal.cents);
  applyDiscount(pointsCoupon(points, POINTS_EXPIRES_AT));
  pointsSpent = points;
  localStorage.setItem(DISCOUNT_KEY, JSON.stringify({ points }));
});

clearCart.addEventListener("click", (event) => {
  event.preventDefault();
  if (orderNumber) {
    return;
  }
  cart = [];
  subtotal = cartTotal(cart);
  weightKg = cartWeight(cart);
  lines.replaceChildren();
  applied = undefined;
  discount = new Money(0);
  pointsSpent = 0;
  discountLine.hidden = true;
  expiryLine.hidden = true;
  localStorage.removeItem(DISCOUNT_KEY);
  showCartCounts();
  pay.disabled = true;
  render();
});

form.addEventListener("change", () => {
  method = METHODS.find((option) => option === new FormData(form).get("method")) ?? method;
  render();
});

dateInput.addEventListener("input", () => render());

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (orderNumber) {
    return;
  }
  const now = new Date();
  render(now);
  if (!form.reportValidity()) {
    return;
  }
  const quote = quoteFor(method, now);
  const delivery = { method, cost: quote.cost, deliveryDate: quote.deliveryDate };
  const number = orderNumberFrom(crypto.getRandomValues(new Uint8Array(ORDER_NUMBER_LENGTH)));
  const order: Order = {
    id: number,
    lines: cart,
    discount,
    shipping: delivery,
    userId: DEMO_USER_ID,
    placedOn: utcDate(now, 0),
    pointsRedeemed: pointsSpent,
  };
  orderNumber = number;
  const earned = pointsEarned(orderTotal(order));
  balance = balance - pointsSpent + earned;
  renderPoints();
  const saved: SavedOrder = {
    number,
    method: delivery.method,
    deliveryDate: delivery.deliveryDate,
    costCents: delivery.cost.cents,
    totalCents: orderTotal(order).cents,
    balanceAfter: balance,
    discountLabel: discountLine.hidden ? undefined : (discountLine.textContent ?? undefined),
  };
  localStorage.setItem(ORDER_KEY, JSON.stringify(saved));
  localStorage.removeItem(DISCOUNT_KEY);
  showPlaced(saved);
});

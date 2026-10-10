import { cartTotal, checkoutSummary, type CartLine, payable } from "../src/cart.js";
import { type Coupon, discountFor } from "../src/coupon.js";
import { Money } from "../src/money.js";
import { freeShipping, shippingNote } from "../src/shipping.js";

/** What the shop sells to everyone who opens the checkout: made-up products and prices. */
const CART: { name: string; line: CartLine }[] = [
  {
    name: "Mechanical keyboard",
    line: { productCode: "KB-87", unitPrice: Money.fromBRL("899,90"), quantity: 1 },
  },
  {
    name: "USB-C cable, 2 m",
    line: { productCode: "USBC-2", unitPrice: Money.fromBRL("49,90"), quantity: 2 },
  },
  {
    name: "Desk mat",
    line: { productCode: "MAT-90", unitPrice: Money.fromBRL("129,00"), quantity: 1 },
  },
];

/** Made-up coupons the shop accepts; codes are matched in upper case. */
const COUPONS: Coupon[] = [
  { code: "WELCOME10", kind: "percent", percent: 10, expiresAt: new Date("2099-12-31T23:59:59Z") },
  { code: "SAVE50", kind: "fixed", amount: Money.fromBRL("50,00"), expiresAt: new Date("2099-12-31T23:59:59Z") },
  { code: "OLD5", kind: "fixed", amount: Money.fromBRL("5,00"), expiresAt: new Date("2020-01-01T00:00:00Z") },
];

const lines = document.querySelector<HTMLUListElement>("#lines")!;
const total = document.querySelector<HTMLParagraphElement>("#total")!;
const shipping = document.querySelector<HTMLParagraphElement>("#free-shipping")!;
const pay = document.querySelector<HTMLButtonElement>("#pay")!;
const form = document.querySelector<HTMLFormElement>("#shipping")!;
const placed = document.querySelector<HTMLParagraphElement>("#placed")!;
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
let discount = new Money(0);

function render(): void {
  const amount = payable(cart, discount);
  const shippingAmount = amount.cents / 100;
  total.textContent = checkoutSummary(cart, discount);
  shipping.textContent = shippingNote(shippingAmount);
  shipping.classList.toggle("badge", freeShipping(shippingAmount));
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
  couponError.textContent = "";
  discountLine.textContent = `Coupon ${coupon.code}: -${discount.toBRL()}`;
  discountLine.hidden = false;
  render();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  pay.disabled = true;
  placed.textContent = "Order placed. You will get an email with the tracking code.";
});

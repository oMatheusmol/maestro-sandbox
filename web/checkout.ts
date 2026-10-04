import { cartTotal, checkoutSummary, type CartLine } from "../src/cart.js";
import { formatBRL, parseBRL } from "../src/money.js";

/** What the shop sells to everyone who opens the checkout: made-up products and prices. */
const CART: { name: string; line: CartLine }[] = [
  { name: "Mechanical keyboard", line: { productCode: "KB-87", unitPrice: "899,90", quantity: 1 } },
  { name: "USB-C cable, 2 m", line: { productCode: "USBC-2", unitPrice: "49,90", quantity: 2 } },
  { name: "Desk mat", line: { productCode: "MAT-90", unitPrice: "129,00", quantity: 1 } },
  { name: "Refund", line: { productCode: "REFUND-1", unitPrice: "-R$ 50,00", quantity: 1 } },
];

const lines = document.querySelector<HTMLUListElement>("#lines")!;
const total = document.querySelector<HTMLParagraphElement>("#total")!;
const pay = document.querySelector<HTMLButtonElement>("#pay")!;
const form = document.querySelector<HTMLFormElement>("#shipping")!;
const placed = document.querySelector<HTMLParagraphElement>("#placed")!;

for (const { name, line } of CART) {
  const item = document.createElement("li");
  const label = document.createElement("span");
  label.textContent = line.quantity > 1 ? `${name} × ${line.quantity}` : name;
  const price = document.createElement("span");
  price.className = "price";
  price.textContent = formatBRL(parseBRL(line.unitPrice) * line.quantity);
  item.append(label, price);
  lines.append(item);
}

const cart = CART.map((c) => c.line);
total.textContent = checkoutSummary(cart);
pay.textContent = `Place order and pay ${formatBRL(cartTotal(cart))}`;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  pay.disabled = true;
  placed.textContent = "Order placed. You will get an email with the tracking code.";
});

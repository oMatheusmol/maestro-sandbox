/** The confirmation after a purchase: "Order placed: <order number>.", the delivery window's last day when known, then "You will get an email with the tracking code." */
export const ORDER_PLACED =
  /^Order placed: [0-9A-HJKMNP-TV-Z]{8}\.( Delivery window ends \d{4}-\d{2}-\d{2}\.)? You will get an email with the tracking code\.$/;

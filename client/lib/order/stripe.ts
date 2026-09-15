import { OrderCheckoutResult } from "../../types/order";

/** Redirect the browser to the Checkout URL created by the server. */
export function redirectToCheckout(result: OrderCheckoutResult) {
  if (!result.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  window.location.assign(result.url);
}

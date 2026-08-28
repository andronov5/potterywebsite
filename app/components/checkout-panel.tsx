"use client";

import { FormEvent, useState } from "react";
import { formatPrice } from "../products";

type CheckoutStatus = "idle" | "processing" | "success";

export function CheckoutPanel({
  price,
  productNumber,
}: {
  price: number;
  productNumber: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const total = price * quantity;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("processing");
    window.setTimeout(() => setStatus("success"), 650);
  }

  if (status === "success") {
    return (
      <section className="checkout-success" aria-live="polite">
        <span className="success-mark" aria-hidden="true">✓</span>
        <p className="eyebrow">Demo confirmation</p>
        <h2>Your pretend order is in.</h2>
        <p>
          No order was created and no payment was processed. Once a real
          payment provider is connected, this screen can show live order details.
        </p>
        <dl>
          <div><dt>Demo order</dt><dd>DEMO-{productNumber}070</dd></div>
          <div><dt>Sample total</dt><dd>{formatPrice(total)}</dd></div>
        </dl>
        <button className="paper-button" type="button" onClick={() => setStatus("idle")}>
          Start another demo order
        </button>
      </section>
    );
  }

  return (
    <section className="checkout-panel" aria-labelledby="checkout-heading">
      <div className="checkout-heading-row">
        <div>
          <p className="eyebrow">Secure checkout preview</p>
          <h2 id="checkout-heading">Make it yours</h2>
        </div>
        <span className="demo-stamp">DEMO</span>
      </div>
      <p className="demo-warning">
        This checkout is a realistic preview. Nothing is submitted, charged,
        or saved.
      </p>

      <form className="checkout-form" onSubmit={submit}>
        <div className="checkout-step">
          <span>01</span>
          <h3>Order</h3>
        </div>
        <div className="quantity-row">
          <span>Quantity</span>
          <div className="quantity-control">
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              aria-label="Decrease quantity"
            >−</button>
            <output aria-live="polite">{quantity}</output>
            <button
              type="button"
              onClick={() => setQuantity((value) => Math.min(10, value + 1))}
              aria-label="Increase quantity"
            >+</button>
          </div>
        </div>
        <div className="order-total">
          <span>Estimated total</span>
          <strong>{formatPrice(total)}</strong>
          <small>Shipping would be calculated when the live checkout is connected.</small>
        </div>

        <div className="checkout-step">
          <span>02</span>
          <h3>Contact + delivery</h3>
        </div>
        <div className="field-grid">
          <label className="full-field">Email<input type="email" name="email" autoComplete="email" required /></label>
          <label className="full-field">Full name<input name="name" autoComplete="name" required /></label>
          <label className="full-field">Street address<input name="address" autoComplete="street-address" required /></label>
          <label>City<input name="city" autoComplete="address-level2" required /></label>
          <label>State<input name="state" autoComplete="address-level1" required /></label>
          <label>ZIP code<input name="zip" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{5}(-[0-9]{4})?" required /></label>
        </div>

        <div className="checkout-step">
          <span>03</span>
          <h3>Payment preview</h3>
        </div>
        <div className="field-grid payment-fields">
          <label className="full-field">Name on card<input name="cardName" autoComplete="cc-name" required /></label>
          <label className="full-field">Card number<input name="card" autoComplete="cc-number" inputMode="numeric" placeholder="4242 4242 4242 4242" pattern="[0-9 ]{15,19}" required /></label>
          <label>Expiration<input name="expiry" autoComplete="cc-exp" inputMode="numeric" placeholder="MM/YY" pattern="(0[1-9]|1[0-2])/[0-9]{2}" required /></label>
          <label>Security code<input name="cvc" autoComplete="cc-csc" inputMode="numeric" placeholder="CVC" pattern="[0-9]{3,4}" required /></label>
        </div>
        <button className="checkout-button" type="submit" disabled={status === "processing"}>
          <span>{status === "processing" ? "Preparing demo order…" : "Place demo order"}</span>
          <strong>{formatPrice(total)}</strong>
        </button>
        <p className="checkout-fine-print">
          Demo only · Do not enter real payment information · No charge will occur
        </p>
      </form>
    </section>
  );
}

"use client";

import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";

export const StepFinish = () => {
  const cart = useCartStore((s) => s.cart);

  const handleCheckout = async () => {
    const items = cart.map((c) => ({
      priceId: c.product.priceId,
      quantity: c.quantity,
    }));

    console.log("cart:", cart);
    console.log("items being sent:", items);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      // Use text first so we can safely handle HTML error pages too
      const text = await res.text();
      console.log("STATUS:", res.status);
      console.log("RAW RESPONSE:", text);

      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        // Not JSON (often an HTML error page)
      }

      if (!res.ok) {
        alert(data.error ?? "Checkout failed. See console RAW RESPONSE.");
        return;
      }

      if (!data?.url) {
        alert("Checkout failed: missing redirect URL.");
        return;
      }

      // Redirect to Stripe hosted checkout page
      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout request failed:", err);
      alert("Checkout request failed. See console for details.");
    }
  };

  return <Button onClick={handleCheckout}>Checkout</Button>;
};

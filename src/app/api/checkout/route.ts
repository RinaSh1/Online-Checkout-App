// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

type Item = { priceId: string; quantity: number };

export function GET() {
  // Visit http://localhost:3000/api/checkout -> should return { ok: true }
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  console.log("✅ HIT POST /api/checkout");

  try {
    const body = (await req.json()) as { items?: Item[] };
    const items = Array.isArray(body.items) ? body.items : [];

    // Validate input
    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    for (const it of items) {
      if (typeof it.priceId !== "string" || it.priceId.length === 0) {
        return NextResponse.json({ error: "Invalid priceId" }, { status: 400 });
      }
      if (!Number.isInteger(it.quantity) || it.quantity < 1) {
        return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_APP_URL (example: http://localhost:3000)" },
        { status: 500 }
      );
    }

    console.log("Creating Stripe session with items:", items);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((it) => ({
        price: it.priceId,
        quantity: it.quantity,
      })),
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel`,
    });

    console.log("✅ Stripe session created:", session.id);

    if (!session.url) {
      return NextResponse.json(
        { error: "Session created but session.url is missing" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("❌ /api/checkout error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

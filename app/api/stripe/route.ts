import { NextResponse } from "next/server"

import { stripe } from "@/lib/stripe"
import supabaseServer from "@/lib/supabase/supabaseServer"
import { getURL } from "@/app/utils/getURL"
import supabaseAdmin from "@/lib/supabase/supabaseAdmin"

export async function GET() {
  try {
    // Check is user authenticated
    const {
      data: { user },
    } = await supabaseServer().auth.getUser()

    if (!user || !user.id || !user.email) {
      return new NextResponse("Unauthenticated", { status: 401 })
    }

    const { data: user_subscription_response } = await supabaseAdmin
      .from("user_subscription")
      .select()
      .eq("user_id", user.id)
      .single()

    if (user_subscription_response && user_subscription_response.stripe_customer_id) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: user_subscription_response.stripe_customer_id,
        return_url: `${getURL()}/settings`,
      })

      return new NextResponse(JSON.stringify({ url: stripeSession.url }))
    }

    const stripeSession = await stripe.checkout.sessions.create({
      success_url: `${getURL()}/settings`,
      cancel_url: `${getURL()}/settings`,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "USD",
            product_data: {
              name: "Companion Pro",
              description: "Create Custom AI Companions",
            },
            unit_amount: 999,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id, // this should match in /api/webhook/route.ts - on line 32 (session?.metadata.userId)
      },
    })

    return new NextResponse(JSON.stringify({ url: stripeSession.url }))
  } catch (error) {
    console.log("[STRIPE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

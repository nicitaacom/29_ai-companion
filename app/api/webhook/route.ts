import Stripe from "stripe"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { stripe } from "@/lib/stripe"
import supabaseAdmin from "@/lib/supabase/supabaseAdmin"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("Stripe-Signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session

  // If user subscribe first time
  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

    if (!session?.metadata?.userId) {
      return new NextResponse("User id is required", { status: 400 })
    }

    const { error: error_insert_user_subscription } = await supabaseAdmin.from("user_subscription").insert({
      user_id: session?.metadata.userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      stripe_price_id: subscription.items.data[0].price.id,
      stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    if (error_insert_user_subscription) {
      console.log(39, `ERROR_INSERTING_USER_SUBSCRIPTION - ${error_insert_user_subscription.message}`)
      return new NextResponse(`${error_insert_user_subscription.message}`, { status: 400 })
    }
  }

  // Ff user update or cancel subscription
  if (event.type === "invoice.payment_succeeded") {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

    const { error: error_updating_user_subscription } = await supabaseAdmin
      .from("user_subscription")
      .update({
        stripe_price_id: subscription.items.data[0].price.id,
        stripe_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id)
    if (error_updating_user_subscription) {
      console.log(51, `ERROR_UPDATING_USER_SUBSCRIPTION - ${error_updating_user_subscription.message}`)
      return new NextResponse(`${error_updating_user_subscription.message}`, { status: 400 })
    }
  }

  return new NextResponse(null, { status: 200 })
}

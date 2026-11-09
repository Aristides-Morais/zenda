import express, { Router } from "express";
import Stripe from "stripe";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireBusiness } from "../../middleware/business.middleware.js";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);
export const billingRouter = Router();

billingRouter.post("/checkout", requireAuth, requireBusiness, async (req, res, next) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.businessId },
    });
    if (!business) throw new Error("Negócio não encontrado");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: req.user!.email,
      client_reference_id: business.id,
      success_url: `${env.APP_URL}/faturacao?success=true`,
      cancel_url: `${env.APP_URL}/faturacao?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

billingRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error("Webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const businessId = session.client_reference_id;
      const subscriptionId = session.subscription as string;

      if (businessId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        // Correção: A API do Stripe agora lê a data no 'items.data[0]'
        const periodEnd = subscription.items.data[0].current_period_end;

        await prisma.business.update({
          where: { id: businessId },
          data: {
            plan: "PRO",
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd: new Date(periodEnd * 1000),
          },
        });
      }
    }

    res.json({ received: true });
  }
);
# Subscription Tiers

ChoreBuddyApp offers two publicly available subscription tiers (**Free** and **Premium**), with two additional tiers (**Family Plus** and **Enterprise**) defined in the backend but not currently exposed in the UI.

---

## Tier Overview

| Feature / Limit              | Free          | Premium                          |
|------------------------------|---------------|----------------------------------|
| **Price**                    | $0/month      | $15/month or $120/year (save 20%)|
| **Family members**           | 2             | Unlimited                        |
| **Chores**                   | 10            | Unlimited                        |
| **Redeemable reward items**  | 3             | Unlimited                        |
| ChoreAI smart assignments    | No            | Yes                              |
| Recurring chores & rotations | No            | Yes                              |
| Photo verification           | No            | Yes                              |
| Chore approval system        | No            | Yes                              |
| Advanced chore settings      | No            | Yes                              |
| Custom points & bonuses      | No            | Yes                              |
| Early completion bonus       | No            | Yes                              |
| Priority assignment          | No            | Yes                              |
| Family goals & challenges    | No            | Yes                              |
| Family email invitations     | No            | Yes                              |
| Analytics export & reports   | No            | Yes                              |
| Weekly email reports         | No            | Yes                              |
| Priority support             | No            | Yes                              |

---

## Free Tier

The Free tier provides basic chore management for small families:

- **Up to 2 family members** (defined in `src/components/lib/constants.jsx` and `src/pages/Pricing.jsx`)
- **Up to 10 chores** (defined in `src/components/hooks/useSubscriptionAccess.jsx`)
- **Up to 3 redeemable reward items** (defined in `src/components/lib/constants.jsx`)
- Manual chore assignment only
- Basic point tracking
- Basic rewards store

All 13 premium features (listed in the table above) are disabled on this tier.

## Premium Tier

The Premium tier removes all resource limits and unlocks every feature:

- **$15/month** or **$120/year** (a 20% annual discount)
- Unlimited family members, chores, and reward items
- All 13 premium features enabled
- 14-day free trial available (sets `subscription_status` to `'trial'`)

Payment is handled via **Stripe Checkout**. After purchase, a Stripe webhook updates the user's `subscription_tier` to `'premium'` and `subscription_status` to `'active'`.

## Backend-Only Tiers (Family Plus & Enterprise)

Two additional tiers are defined in `functions/lib/shared-utils.ts` and referenced in `src/hooks/validateSubscriptionChange.js`, but are **not exposed in the pricing UI**:

| Tier            | Max family members (on downgrade validation) |
|-----------------|----------------------------------------------|
| Free            | 6                                            |
| Premium         | 15                                           |
| Family Plus     | 30                                           |
| Enterprise      | 50                                           |

These tiers exist in the subscription change validation logic to enforce member-count limits when downgrading, but there are no corresponding pricing plans, Stripe products, or UI flows for them.

---

## How Feature Gating Works

### Frontend

1. **`useSubscriptionAccess` hook** (`src/components/hooks/useSubscriptionAccess.jsx`) — the central source of truth for the current tier's feature matrix and resource limits. It exposes:
   - `canAccess(featureName)` — returns `true`/`false` for a given premium feature
   - `hasReachedLimit(limitType)` — checks whether the user has hit the cap for family members, chores, or reward items
   - `isPremium` / `isFree` — convenience booleans

2. **`FeatureGate` component** (`src/components/ui/FeatureGate.jsx`) — wraps UI sections that require a specific feature. If the user lacks access, it either hides the content or redirects to the Pricing page.

3. **`UpgradeModal`** (`src/components/ui/UpgradeModal.jsx`) — shown when a user tries to use a premium-only feature (e.g., ChoreAI from the Dashboard).

4. **`LimitReachedModal`** (`src/components/ui/LimitReachedModal.jsx`) — shown when a user hits a resource limit (e.g., adding a 3rd family member on Free).

### Backend

- `functions/generateReport.ts` checks `subscription_tier === 'free'` and rejects report generation for free users.
- `functions/lib/shared-utils.ts` validates feature access for email invitations, ChoreAI, and reports (Premium+ only).
- `src/hooks/validateSubscriptionChange.js` prevents downgrading if the family has more members than the target tier allows.

---

## Payment Flow

1. User selects Premium on the **Pricing page** (`src/pages/Pricing.jsx`)
2. Frontend calls `stripeCheckout` with `create-checkout-session` endpoint (`functions/stripeCheckout.ts`)
3. Backend creates a Stripe Checkout Session using monthly or yearly price IDs from environment variables
4. User is redirected to **Stripe's hosted checkout**
5. On success, Stripe fires a `checkout.session.completed` webhook
6. The webhook handler updates the user's `subscription_tier` to `'premium'` and `subscription_status` to `'active'`
7. User is redirected to `/PaymentSuccess` (`src/pages/PaymentSuccess.jsx`)
8. If canceled, user lands on `/PaymentCancel` (`src/pages/PaymentCancel.jsx`)

### Subscription Lifecycle Events

The Stripe webhook handler (`functions/stripeCheckout.ts`) also processes:

| Stripe Event                        | Action                                          |
|-------------------------------------|--------------------------------------------------|
| `customer.subscription.created`     | Set tier to premium, status to active             |
| `customer.subscription.updated`     | Update tier and status                            |
| `customer.subscription.deleted`     | Downgrade to free, status to canceled             |
| `invoice.payment_failed`            | Set status to `past_due`                          |
| `invoice.payment_succeeded`         | Set status to `active`                            |

### Managing a Subscription

Premium users can open the **Stripe Billing Portal** from the Account page (`src/pages/Account.jsx`) to update payment methods, view invoices, or cancel.

---

## Data Model

Subscription state is stored on the user object with these fields:

| Field                  | Values                                          |
|------------------------|--------------------------------------------------|
| `subscription_tier`    | `free`, `premium`, (`family_plus`, `enterprise`) |
| `subscription_status`  | `active`, `trial`, `past_due`, `canceled`         |
| `stripe_customer_id`   | Stripe customer ID string                         |
| `trial_ends_at`        | ISO 8601 timestamp (set during trial init)        |

---

## Known Inconsistencies

There are some discrepancies in the resource limits defined across different files:

- **Family member limit (Free tier):** `useSubscriptionAccess.jsx` says **3**, `constants.jsx` and `Pricing.jsx` say **2**, and `validateSubscriptionChange.js` uses **6** for downgrade validation.
- **Family member limit (Premium tier):** `useSubscriptionAccess.jsx` and `constants.jsx` say **unlimited (-1)**, but `validateSubscriptionChange.js` caps at **15** for downgrade checks, and `familyHelpers.jsx` also uses **15**.

These inconsistencies should be reconciled so that a single source of truth governs all limit checks.

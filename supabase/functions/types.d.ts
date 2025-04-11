// Deno runtime types
declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
  }
  export const env: Env;
  export function serve(handler: (req: any) => Promise<Response>): void;
}

// Our subscription model based on the payment integration setup
interface SubscriptionTier {
  name: 'free' | 'basic' | 'pro';
  requestLimit: number;
  priceId: string | null;
}

interface Profile {
  id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  subscription_plan: 'free' | 'basic' | 'pro';
  request_limit: number;
  subscription_current_period_end?: string;
  updated_at: string;
}

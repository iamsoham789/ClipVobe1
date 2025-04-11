
export interface Database {
  public: {
    Tables: {
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          status: string;
          tier: string;
          created_at: string;
          updated_at: string;
          expires_at: string | null;
          dodo_subscription_id: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
      };
      usage: {
        Row: {
          id: string;
          user_id: string;
          feature: string;
          count: number;
          reset_at: string;
          created_at: string | null;
          updated_at: string | null;
        };
      };
    };
    Views: {
      [key: string]: any;
    };
    Functions: {
      [key: string]: any;
    };
    Enums: {
      subscription_tier: "free" | "basic" | "pro" | "creator";
    };
  };
}

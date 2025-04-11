import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PaymentButtonProps {
  paymentLink: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary";
  className?: string;
  plan?: string; // Add plan prop to track which plan was selected
}

export function PaymentButton({
  paymentLink,
  children,
  variant = "default",
  className,
  plan,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);
      console.log("Redirecting to Dodo:", paymentLink);

      // Modify the URL to include plan information and redirect to payment success handler
      let url = paymentLink;

      // Add plan parameter if not already in the URL
      if (plan && !url.includes("plan=")) {
        const separator = url.includes("?") ? "&" : "?";
        url += `${separator}plan=${plan}`;
      }

      // Ensure redirect URL includes payment_success path
      if (!url.includes("redirect_url=")) {
        const separator = url.includes("?") ? "&" : "?";
        const redirectUrl = encodeURIComponent(
          `${window.location.origin}/payment-success`,
        );
        url += `${separator}redirect_url=${redirectUrl}`;
      } else if (!url.includes("payment-success")) {
        // Replace existing redirect URL with one that includes payment-success
        url = url.replace(
          /redirect_url=[^&]+/,
          `redirect_url=${encodeURIComponent(`${window.location.origin}/payment-success`)}`,
        );
      }

      window.location.href = url;
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      variant={variant}
      className={className}
      disabled={loading}
    >
      {loading ? "Processing..." : children}
    </Button>
  );
}

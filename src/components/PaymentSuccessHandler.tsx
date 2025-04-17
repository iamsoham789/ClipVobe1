
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

const PaymentSuccessHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      // Parse URL parameters from Stripe redirect
      const params = new URLSearchParams(location.search);
      const sessionId = params.get("session_id");
      
      if (!sessionId || !user) {
        console.error("Missing payment information:", {
          sessionId,
          userId: user?.id,
        });
        toast.error("Payment verification failed. Please contact support.");
        navigate("/dashboard");
        return;
      }

      try {
        console.log("Verifying payment session:", {
          userId: user.id,
          sessionId,
        });

        // Call the verify-payment edge function to check the payment status and update the subscription
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { 
            sessionId,
            userId: user.id
          }
        });

        if (error) {
          console.error("Error verifying payment:", error);
          toast.error("Payment verification failed. Please contact support.");
          navigate("/dashboard");
          return;
        }

        if (data?.success) {
          toast.success(`Your ${data.tier} subscription has been activated!`);
        } else {
          toast.error("Payment verification failed. Please contact support.");
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error("An unexpected error occurred. Please contact support.");
      }

      // Redirect to dashboard
      navigate("/dashboard");
    };

    if (location.pathname === "/payment-success") {
      handlePaymentSuccess();
    }
  }, [location, navigate, user]);

  return null; // This component doesn't render anything
};

export default PaymentSuccessHandler;

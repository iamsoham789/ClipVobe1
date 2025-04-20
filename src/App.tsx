
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Pricing from "./pages/Pricing";
import PricingFake from "./pages/Pricingfake";
import Blog from "./pages/Blog";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import PaymentSuccessHandler from "./components/PaymentSuccessHandler";
import Help from "./pages/Help";
import Contact from "./pages/Contact";
import Settings from "./components/dashboard/Settings";
import ThankYou from "./pages/thankyou";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/pricingfake" element={<PricingFake />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/payment-success" element={<Dashboard />} />
          <Route path="/help" element={<Help />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/thankyou" element={<ThankYou />} />
          <Route path="/settings" element={<Settings usageStats={{}} featureOptions={[]} tier={""} handleNavigation={function (itemId: string, subItemId?: string): void {
            throw new Error("Function not implemented.");
          } } />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <PaymentSuccessHandler />
        <Toaster 
          position="top-right" 
          closeButton={true}
          richColors={true}
          toastOptions={{
            className: "bg-clipvobe-gray-800 text-white border-clipvobe-gray-700",
            style: { background: "#1a1a2e", color: "white", border: "1px solid #2a2a3e" }
          }}
        />
      </AuthProvider>
    </Router>
  );
}

export default App;

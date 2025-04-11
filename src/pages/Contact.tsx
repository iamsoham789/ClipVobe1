import React from "react";
import { Button } from "../components/ui/button";
import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Contact = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-clipvobe-dark flex flex-col">
      <div className="container mx-auto px-4 py-16 flex-1 flex flex-col items-center justify-center">
        <div className="max-w-3xl w-full bg-clipvobe-gray-800 rounded-xl p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
            <Mail className="mr-3 h-8 w-8 text-clipvobe-cyan" />
            Contact Clipvobe Support
          </h1>

          <div className="mb-8 text-clipvobe-gray-300">
            <p className="mb-4">
              We're here to help with any questions or issues you might have
              with your Clipvobe account or services.
            </p>
            <p className="mb-4">
              For the fastest response, please email our support team at:
            </p>
            <div className="bg-clipvobe-gray-700 p-4 rounded-lg mb-6 text-center">
              <p className="text-clipvobe-cyan font-medium text-lg">
                Email To Be Added Soon
              </p>
            </div>
            <p>
              Our support team typically responds within 24 hours during
              business days.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="border-clipvobe-cyan text-clipvobe-cyan hover:bg-clipvobe-cyan/10"
            >
              Return to Dashboard
            </Button>
            <Button
              onClick={() => navigate("/help")}
              className="bg-clipvobe-cyan text-black hover:bg-clipvobe-cyan/80"
            >
              View Help Resources
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

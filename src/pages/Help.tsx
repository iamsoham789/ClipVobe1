import React from "react";
import { Button } from "../components/ui/button";
import { HelpCircle, BookOpen, Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Help = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-clipvobe-dark flex flex-col">
      <div className="container mx-auto px-4 py-16 flex-1">
        <Button
          onClick={() => navigate("/dashboard")}
          variant="ghost"
          className="mb-6 text-white hover:text-clipvobe-cyan"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-4xl font-bold text-white mb-8 flex items-center">
          <HelpCircle className="mr-3 h-8 w-8 text-clipvobe-cyan" />
          Help & Support
        </h1>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl">
          <div className="bg-clipvobe-gray-800 rounded-xl p-6 shadow-lg hover:bg-clipvobe-gray-700 transition-colors">
            <BookOpen className="h-12 w-12 text-clipvobe-cyan mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-3">
              Knowledge Base
            </h2>
            <p className="text-clipvobe-gray-300 mb-6">
              Browse our comprehensive guides, tutorials, and FAQs to learn more
              about using Clipvobe's features effectively.
            </p>
            <Button
              onClick={() => navigate("/blog")}
              className="w-full bg-clipvobe-cyan text-black hover:bg-clipvobe-cyan/80"
            >
              Visit Our Blog
            </Button>
          </div>

          <div className="bg-clipvobe-gray-800 rounded-xl p-6 shadow-lg hover:bg-clipvobe-gray-700 transition-colors">
            <Mail className="h-12 w-12 text-clipvobe-cyan mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-3">
              Contact Support
            </h2>
            <p className="text-clipvobe-gray-300 mb-6">
              Need personalized help? Our support team is ready to assist you
              with any questions or issues you might have.
            </p>
            <Button
              onClick={() => navigate("/contact")}
              className="w-full bg-clipvobe-cyan text-black hover:bg-clipvobe-cyan/80"
            >
              Contact Us
            </Button>
          </div>
        </div>

        <div className="mt-12 bg-clipvobe-gray-800 rounded-xl p-6 max-w-5xl">
          <h2 className="text-2xl font-semibold text-white mb-4">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-clipvobe-cyan mb-2">
                How do I upgrade my subscription?
              </h3>
              <p className="text-clipvobe-gray-300">
                You can upgrade your subscription by visiting the Settings page
                in your dashboard and selecting the "Your Plan" section.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-clipvobe-cyan mb-2">
                How are my monthly usage limits calculated?
              </h3>
              <p className="text-clipvobe-gray-300">
                Usage limits reset on the first day of each month. Your current
                usage is displayed in the Settings page.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-clipvobe-cyan mb-2">
                Can I request a refund?
              </h3>
              <p className="text-clipvobe-gray-300">
                Yes, you can request a refund within 14 days of your
                subscription purchase. Please contact our support team for
                assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;

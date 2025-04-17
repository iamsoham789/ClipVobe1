import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <Card className="bg-[#111] border-clipvobe-gray-800">
        <CardContent className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-white">
            Terms of Service
          </h1>

          <div className="prose prose-invert max-w-none">
            <p className="text-clipvobe-gray-300 mb-4">
              This page will contain the Terms of Service for ClipVobe. The
              content will be added later.
            </p>

            <div className="bg-clipvobe-gray-800/50 p-6 rounded-lg border border-clipvobe-gray-700 my-6">
              <h2 className="text-xl font-semibold mb-3 text-clipvobe-cyan">
                Content Placeholder
              </h2>
              <p className="text-clipvobe-gray-300">
                This is a placeholder for the Terms of Service content. The
                actual terms will be added later.
              </p>
            </div>

            <p className="text-clipvobe-gray-400 text-sm mt-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

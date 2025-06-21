// src/components/QuoteSection.jsx
import React from "react";

const QuoteSection = () => {
  return (
    <section className="py-12 md:py-16 bg-indigo-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="text-xl md:text-3xl font-serif italic text-gray-800 mb-6">
            "A reader lives a thousand lives before he dies. The man who never
            reads lives only one."
          </blockquote>
          <cite className="text-base md:text-lg text-gray-600">
            - George R.R. Martin
          </cite>
        </div>
      </div>
    </section>
  );
};

export default QuoteSection;

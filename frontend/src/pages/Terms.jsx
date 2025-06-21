import React from "react";
import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Terms and Conditions
        </h1>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Introduction
              </h2>
              <p className="text-gray-600">
                Welcome to our online bookstore. By accessing and using our
                website, you agree to be bound by these Terms and Conditions.
                Please read them carefully before making a purchase.
              </p>
            </section>

            {/* Account Terms */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Account Terms
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>
                      You must be at least 18 years old to create an account
                    </li>
                    <li>
                      You are responsible for maintaining the security of your
                      account
                    </li>
                    <li>You must provide accurate and complete information</li>
                    <li>
                      You are responsible for all activities under your account
                    </li>
                    <li>
                      We reserve the right to suspend or terminate accounts
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Ordering and Payment */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Ordering and Payment
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Order Acceptance
                  </h3>
                  <p className="text-gray-600">
                    All orders are subject to acceptance and availability. We
                    reserve the right to refuse service to anyone for any reason
                    at any time.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Pricing and Payment
                  </h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>Prices are subject to change without notice</li>
                    <li>
                      Payment must be made in full before order processing
                    </li>
                    <li>We accept major credit cards and PayPal</li>
                    <li>All prices include applicable taxes</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Shipping and Delivery */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Shipping and Delivery
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Shipping times are estimates and not guaranteed</li>
                  <li>
                    International shipping may be subject to customs delays
                  </li>
                  <li>Risk of loss transfers to you upon delivery</li>
                  <li>
                    Additional shipping charges may apply for international
                    orders
                  </li>
                </ul>
              </div>
            </section>

            {/* Returns and Refunds */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Returns and Refunds
              </h2>
              <p className="text-gray-600 mb-4">
                Please refer to our{" "}
                <Link
                  to="/returns"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Returns & Refunds Policy
                </Link>{" "}
                for detailed information about our return process and
                eligibility.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Intellectual Property
              </h2>
              <p className="text-gray-600">
                All content on this website, including text, graphics, logos,
                and images, is the property of our bookstore and is protected by
                copyright laws. Unauthorized use is prohibited.
              </p>
            </section>

            {/* User Conduct */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                User Conduct
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 mb-4">You agree not to:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Use the website for any illegal purpose</li>
                  <li>Violate any laws or regulations</li>
                  <li>Infringe on others' intellectual property rights</li>
                  <li>Interfere with website functionality</li>
                  <li>Attempt to gain unauthorized access</li>
                </ul>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Limitation of Liability
              </h2>
              <p className="text-gray-600">
                We shall not be liable for any indirect, incidental, special,
                consequential, or punitive damages resulting from your use of or
                inability to use the service.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Governing Law
              </h2>
              <p className="text-gray-600">
                These Terms shall be governed by and construed in accordance
                with the laws of the United States, without regard to its
                conflict of law provisions.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Changes to Terms
              </h2>
              <p className="text-gray-600">
                We reserve the right to modify these terms at any time. We will
                notify users of any material changes by posting the new Terms on
                this page.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Contact Information
              </h2>
              <p className="text-gray-600">
                Questions about the Terms should be sent to us at{" "}
                <Link
                  to="/contact"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  support@bookstore.com
                </Link>
                .
              </p>
            </section>

            {/* Last Updated */}
            <div className="text-sm text-gray-500">
              Last Updated: March 15, 2024
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;

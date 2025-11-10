"use client";

import Link from "next/link";
import { FileText, AlertTriangle, Shield, XCircle } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.15)_1px,_transparent_0)] bg-[size:24px_24px] opacity-40"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 mb-6 shadow-lg shadow-indigo-500/30">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-lg">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Content */}
        <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-8 md:p-12 space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-indigo-400" />
              1. Acceptance of Terms
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>
                By accessing and using Rytmo ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              2. Description of Service
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>
                Rytmo is a habit tracking and journaling application that allows users to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Create and track personal habits</li>
                <li>Record daily journal entries with text and images</li>
                <li>View analytics and progress visualizations</li>
                <li>Access AI-powered features for habit planning</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              3. User Accounts
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>
                <strong className="text-white">Account Creation:</strong> You must create an account to use Rytmo. You are responsible for maintaining the confidentiality of your account credentials.
              </p>
              <p>
                <strong className="text-white">Account Security:</strong> You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use.
              </p>
              <p>
                <strong className="text-white">Account Eligibility:</strong> You must be at least 13 years old to use Rytmo. By using the Service, you represent that you meet this age requirement.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-indigo-400" />
              4. User Responsibilities
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>You agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and complete information when creating your account</li>
                <li>Use the Service only for lawful purposes</li>
                <li>Not share your account credentials with others</li>
                <li>Not attempt to gain unauthorized access to the Service</li>
                <li>Not upload malicious code, viruses, or harmful content</li>
                <li>Respect the intellectual property rights of others</li>
                <li>Not use the Service to harass, abuse, or harm others</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              5. Content and Intellectual Property
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>
                <strong className="text-white">Your Content:</strong> You retain ownership of all content you create or upload to Rytmo. By using the Service, you grant us a license to store, process, and display your content solely for the purpose of providing the Service.
              </p>
              <p>
                <strong className="text-white">Our Content:</strong> The Rytmo service, including its design, features, and functionality, is owned by us and protected by copyright, trademark, and other intellectual property laws.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              6. Service Availability
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>
                We strive to provide reliable service but do not guarantee that the Service will be available 100% of the time. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We are not liable for any loss or inconvenience resulting from Service unavailability.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              7. Limitation of Liability
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, RYTMO IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
              </p>
              <p>
                We shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, profits, or business opportunities, arising from your use of the Service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-indigo-400" />
              8. Account Termination
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>
                <strong className="text-white">By You:</strong> You may delete your account at any time through your account settings. Upon deletion, your data will be removed within 30 days.
              </p>
              <p>
                <strong className="text-white">By Us:</strong> We reserve the right to suspend or terminate your account if you violate these Terms of Service or engage in fraudulent, abusive, or illegal activity.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              9. Changes to Terms
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>
                We reserve the right to modify these Terms of Service at any time. We will notify users of significant changes by updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the new terms.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              10. Governing Law
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>
                These Terms of Service shall be governed by and construed in accordance with applicable laws. Any disputes arising from these terms shall be resolved through appropriate legal channels.
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="pt-8 mt-8 border-t border-slate-700/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/"
                className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                ← Back to Home
              </Link>
              <Link
                href="/privacy"
                className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                View Privacy Policy →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


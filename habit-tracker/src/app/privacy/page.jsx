"use client";

import Link from "next/link";
import { ShieldCheck, Database, Lock, Eye, Trash2, Mail } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(99,102,241,0.15)_1px,_transparent_0)] bg-[size:24px_24px] opacity-40"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 mb-6 shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-lg">
            Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Content */}
        <div className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-8 md:p-12 space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Database className="w-6 h-6 text-indigo-400" />
              1. Information We Collect
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>
                <strong className="text-white">Account Information:</strong> When you sign up, we collect your email address and authentication information (handled securely by Supabase).
              </p>
              <p>
                <strong className="text-white">Profile Data:</strong> Your name, avatar, and preferences that you choose to provide.
              </p>
              <p>
                <strong className="text-white">Habit Data:</strong> Habits you create, completion records, notes, and analytics data.
              </p>
              <p>
                <strong className="text-white">Journal Entries:</strong> Text content and images you upload to your journal.
              </p>
              <p>
                <strong className="text-white">Usage Data:</strong> We may collect information about how you interact with the app to improve our services.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Eye className="w-6 h-6 text-indigo-400" />
              2. How We Use Your Information
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and maintain the Rytmo service</li>
                <li>Process your habit tracking and journal entries</li>
                <li>Generate analytics and insights about your progress</li>
                <li>Respond to your requests and provide customer support</li>
                <li>Send you important updates about the service</li>
                <li>Improve and optimize the app experience</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-indigo-400" />
              3. Data Storage and Security
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>
                Your data is stored securely using <strong className="text-white">Supabase</strong>, a trusted cloud database service. We implement industry-standard security measures including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encrypted data transmission (HTTPS)</li>
                <li>Secure authentication and authorization</li>
                <li>Regular security audits and updates</li>
                <li>Access controls to ensure only you can access your data</li>
              </ul>
              <p className="mt-4">
                <strong className="text-white">Third-Party Services:</strong> We use the following services that may process your data:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Supabase</strong> - Database and authentication (Privacy Policy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">supabase.com/privacy</a>)</li>
                <li><strong>Vercel</strong> - Hosting and deployment (Privacy Policy: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">vercel.com/legal/privacy-policy</a>)</li>
                <li><strong>OpenAI</strong> - AI features (only when you use chat/plan features) (Privacy Policy: <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">openai.com/policies/privacy-policy</a>)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Trash2 className="w-6 h-6 text-indigo-400" />
              4. Your Rights
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Access:</strong> Request a copy of all data we have about you</li>
                <li><strong className="text-white">Correction:</strong> Update or correct your personal information</li>
                <li><strong className="text-white">Deletion:</strong> Request deletion of your account and all associated data</li>
                <li><strong className="text-white">Export:</strong> Export your habit and journal data</li>
                <li><strong className="text-white">Opt-out:</strong> Unsubscribe from non-essential communications</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us using the information provided below or use the data management options in your account settings.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              5. Data Retention
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>
                We retain your data for as long as your account is active or as needed to provide you services. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal purposes.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              6. Children's Privacy
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>
                Rytmo is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">
              7. Changes to This Policy
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Mail className="w-6 h-6 text-indigo-400" />
              8. Contact Us
            </h2>
            <div className="text-slate-300 space-y-3 ml-9">
              <p>
                If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
              </p>
              <div className="bg-slate-700/30 rounded-lg p-4 mt-4 border border-slate-600/30">
                <p className="text-white font-medium mb-2">Rytmo Support</p>
                <p className="text-slate-300">
                  Email: <a href="mailto:privacy@rytmo.app" className="text-indigo-400 hover:text-indigo-300 underline">privacy@rytmo.app</a>
                </p>
                <p className="text-slate-300 mt-2">
                  (Please replace with your actual contact email)
                </p>
              </div>
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
                href="/terms"
                className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                View Terms of Service →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


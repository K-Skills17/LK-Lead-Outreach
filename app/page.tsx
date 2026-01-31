'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Shield, Users } from 'lucide-react';
import { Navbar } from '@/components/ui/navbar';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-black text-gray-900 mb-6">
            LK Lead Outreach
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Internal tool for managing leads and SDR workflows
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Admin Access */}
            <Link
              href="/admin"
              className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:scale-105 transition-transform border-2 border-gray-200 hover:border-blue-600"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
              <p className="text-gray-600 mb-4">
                Manage SDRs, assign leads, and oversee all activity
              </p>
              <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                <span>Access Admin</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* SDR Access */}
            <Link
              href="/sdr/login"
              className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all border-2 border-gray-200 hover:border-blue-600"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">SDR Login</h2>
              <p className="text-gray-600 mb-4">
                Access your lead queue and manage follow-ups
              </p>
              <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                <span>SDR Login</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

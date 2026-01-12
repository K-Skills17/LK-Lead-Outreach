'use client';

import { useState } from 'react';

export default function AdminTestPage() {
  const [output, setOutput] = useState<string[]>([]);

  const addOutput = (msg: string) => {
    setOutput(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  const runTest = async () => {
    setOutput([]);
    addOutput('🔍 Starting admin system test...');

    try {
      // Test 1: Check diagnostic
      addOutput('1️⃣ Checking environment variables...');
      const diagRes = await fetch('/api/admin/diagnostic');
      const diagData = await diagRes.json();
      addOutput(`✅ Diagnostic: ${JSON.stringify(diagData, null, 2)}`);

      // Test 2: Try login
      addOutput('2️⃣ Attempting login...');
      const loginRes = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'contato@lkdigital.org',
          password: 'K5h3s2#195962'
        })
      });
      
      const loginData = await loginRes.json();
      
      if (!loginRes.ok) {
        addOutput(`❌ Login failed: ${JSON.stringify(loginData)}`);
        return;
      }
      
      addOutput(`✅ Login successful!`);
      addOutput(`🔑 Token received: ${loginData.token?.substring(0, 20)}...`);

      // Test 3: Try analytics with token
      addOutput('3️⃣ Fetching analytics with token...');
      const analyticsRes = await fetch('/api/admin/analytics?period=30', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });

      if (!analyticsRes.ok) {
        const errorData = await analyticsRes.json();
        addOutput(`❌ Analytics failed (${analyticsRes.status}): ${JSON.stringify(errorData)}`);
        return;
      }

      const analyticsData = await analyticsRes.json();
      addOutput(`✅ Analytics success!`);
      addOutput(`📊 Data: ${JSON.stringify(analyticsData.overview, null, 2)}`);

    } catch (error) {
      addOutput(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-4">🔧 Admin System Test</h1>
          <p className="text-gray-600 mb-6">
            This page tests the admin login and analytics flow to diagnose issues.
          </p>

          <button
            onClick={runTest}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all mb-6"
          >
            🚀 Run Test
          </button>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
            {output.length === 0 ? (
              <div className="text-gray-500">Click "Run Test" to start...</div>
            ) : (
              output.map((line, i) => (
                <div key={i} className="mb-1 whitespace-pre-wrap">{line}</div>
              ))
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">📋 What to Check:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ Diagnostic should show all environment variables as <code>true</code></li>
              <li>✅ Login should return a token</li>
              <li>✅ Analytics should return data with the token</li>
              <li>❌ If any step fails, check the error message</li>
            </ul>
          </div>

          <div className="mt-4">
            <a
              href="/admin"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Admin Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

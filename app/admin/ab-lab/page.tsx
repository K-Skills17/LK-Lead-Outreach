'use client';

import { useState, useEffect } from 'react';
import {
  Loader2,
  TrendingUp,
  Target,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Zap,
  Mail,
  MousePointerClick,
  MessageSquare,
  Calendar,
} from 'lucide-react';

interface VariantPerformance {
  name: string;
  weight: number;
  distribution: string;
  sampleSize: number;
  sent: number;
  opened: number;
  clicked: number;
  responded: number;
  booked: number;
  openRate: number;
  clickRate: number;
  responseRate: number;
  bookingRate: number;
  isWinner: boolean;
  confidence: number;
}

interface ABTestData {
  testId: string;
  testName: string;
  description?: string;
  testType: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  variants: VariantPerformance[];
  winner?: string;
  confidence: number;
  bestVariant?: string;
  totalSent: number;
  totalOpened: number;
  avgOpenRate: number;
}

interface ABLabData {
  tests: ABTestData[];
  overallStats: {
    totalTests: number;
    activeTests: number;
    completedTests: number;
    variantPerformance: VariantPerformance[];
  };
}

export default function ABLabPage() {
  const [authToken, setAuthToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<ABLabData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('admin_token');
    if (savedToken) {
      setAuthToken(savedToken);
      setIsAuthenticated(true);
      loadABLabData(savedToken);
    } else {
      // Redirect to admin login if not authenticated
      window.location.href = '/admin';
    }
  }, []);

  const loadABLabData = async (token: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/ab-lab', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('admin_token');
        setAuthToken('');
        window.location.href = '/admin';
        return;
      }

      const labData = await response.json();
      setData(labData);
      
      // Auto-select first test if available
      if (labData.tests && labData.tests.length > 0 && !selectedTest) {
        setSelectedTest(labData.tests[0].testId);
      }
    } catch (err) {
      console.error('Error loading AB Lab data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getVariantColor = (variantName: string) => {
    if (variantName.includes('A') || variantName.includes('Control')) {
      return 'from-blue-500 to-blue-600';
    }
    if (variantName.includes('B') || variantName.includes('Personalized')) {
      return 'from-purple-500 to-pink-500';
    }
    if (variantName.includes('C') || variantName.includes('Question')) {
      return 'from-orange-500 to-red-500';
    }
    return 'from-gray-500 to-gray-600';
  };

  const getVariantLabel = (variantName: string) => {
    if (variantName.includes('A') || variantName.includes('Control')) {
      return 'Control (Generic)';
    }
    if (variantName.includes('B') || variantName.includes('Personalized')) {
      return 'Personalized (AI)';
    }
    if (variantName.includes('C') || variantName.includes('Question')) {
      return 'Question-Based';
    }
    return variantName;
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading A/B Lab...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No A/B test data available</p>
        </div>
      </div>
    );
  }

  const currentTest = data.tests.find(t => t.testId === selectedTest) || data.tests[0];
  const overallVariants = data.overallStats.variantPerformance;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  A/B Lab
                </h1>
                <p className="text-xs text-gray-500">Variant Performance Analysis</p>
              </div>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('admin_token');
                window.location.href = '/admin';
              }}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{data.overallStats.totalTests}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Total Tests</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{data.overallStats.activeTests}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Active Tests</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{data.overallStats.completedTests}</span>
            </div>
            <p className="text-sm font-medium text-gray-600">Completed</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {overallVariants.length > 0
                  ? Math.round(overallVariants.reduce((sum, v) => sum + v.openRate, 0) / overallVariants.length)
                  : 0}%
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600">Avg Open Rate</p>
          </div>
        </div>

        {/* Test Selector */}
        {data.tests.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-6 mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Select Test</label>
            <select
              value={selectedTest || data.tests[0].testId}
              onChange={(e) => setSelectedTest(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {data.tests.map((test) => (
                <option key={test.testId} value={test.testId}>
                  {test.testName} ({test.status}) - {test.variants.length} variants
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Variant Performance */}
        {currentTest && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Variant Performance</h2>
                <p className="text-gray-600">{currentTest.testName}</p>
              </div>
              {currentTest.winner && (
                <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    Winner: {getVariantLabel(currentTest.winner)} ({currentTest.confidence.toFixed(1)}% confidence)
                  </span>
                </div>
              )}
            </div>

            {/* Variants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {currentTest.variants.map((variant, index) => (
                <div
                  key={variant.name}
                  className={`bg-gradient-to-br ${getVariantColor(variant.name)} rounded-2xl shadow-xl p-6 text-white relative overflow-hidden ${
                    variant.isWinner ? 'ring-4 ring-yellow-400 ring-offset-2' : ''
                  }`}
                >
                  {/* Winner Badge */}
                  {variant.isWinner && (
                    <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                      WINNER
                    </div>
                  )}

                  {/* Variant Header */}
                  <div className="mb-4">
                    <h3 className="text-2xl font-bold mb-1">{getVariantLabel(variant.name)}</h3>
                    <p className="text-white/80 text-sm">Distribution: {variant.distribution}</p>
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-3 mb-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/80">Open Rate</span>
                        <span className="text-lg font-bold">{variant.openRate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div
                          className="bg-white rounded-full h-2 transition-all"
                          style={{ width: `${Math.min(variant.openRate, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/10 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <Mail className="w-3 h-3" />
                          <span className="text-xs text-white/80">Sent</span>
                        </div>
                        <p className="text-lg font-bold">{variant.sent}</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <TrendingUp className="w-3 h-3" />
                          <span className="text-xs text-white/80">Opened</span>
                        </div>
                        <p className="text-lg font-bold">{variant.opened}</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <MousePointerClick className="w-3 h-3" />
                          <span className="text-xs text-white/80">Clicked</span>
                        </div>
                        <p className="text-lg font-bold">{variant.clicked}</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <MessageSquare className="w-3 h-3" />
                          <span className="text-xs text-white/80">Responded</span>
                        </div>
                        <p className="text-lg font-bold">{variant.responded}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Rates */}
                  <div className="border-t border-white/20 pt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/80">Click Rate:</span>
                      <span className="font-semibold">{variant.clickRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/80">Response Rate:</span>
                      <span className="font-semibold">{variant.responseRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/80">Booking Rate:</span>
                      <span className="font-semibold">{variant.bookingRate.toFixed(1)}%</span>
                    </div>
                    {variant.confidence > 0 && (
                      <div className="flex justify-between text-xs mt-2 pt-2 border-t border-white/20">
                        <span className="text-white/80">Confidence:</span>
                        <span className="font-semibold">{variant.confidence.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Performance Comparison Table */}
            <div className="mt-8 bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Detailed Performance Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Variant</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Sent</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Opened</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Open Rate</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Clicked</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Response</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Booking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTest.variants.map((variant) => (
                      <tr
                        key={variant.name}
                        className={`border-b border-gray-100 ${
                          variant.isWinner ? 'bg-yellow-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-4 font-medium">
                          <div className="flex items-center gap-2">
                            {getVariantLabel(variant.name)}
                            {variant.isWinner && (
                              <CheckCircle className="w-4 h-4 text-yellow-600" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">{variant.sent}</td>
                        <td className="py-3 px-4 text-right">{variant.opened}</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {variant.openRate.toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-right">{variant.clicked}</td>
                        <td className="py-3 px-4 text-right">{variant.responded}</td>
                        <td className="py-3 px-4 text-right">{variant.booked}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* No Tests Message */}
        {data.tests.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-12 text-center">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No A/B Tests Found</h3>
            <p className="text-gray-600 mb-6">
              Create an A/B test to start comparing variant performance.
            </p>
            <button
              onClick={() => window.location.href = '/admin'}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

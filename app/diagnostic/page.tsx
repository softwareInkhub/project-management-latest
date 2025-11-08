'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function DiagnosticPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({});
  const [cookieData, setCookieData] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Capture localStorage
    const lsData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        lsData[key] = localStorage.getItem(key) || '';
      }
    }
    setLocalStorageData(lsData);

    // Capture cookies
    setCookieData(document.cookie.split(';').map(c => c.trim()));

    // Add diagnostic logs
    const diagnosticLogs = [
      `✅ useAuth - user: ${user?.email || 'null'}`,
      `✅ useAuth - isLoading: ${isLoading}`,
      `✅ useAuth - isAuthenticated: ${isAuthenticated}`,
      `✅ localStorage.user_id: ${localStorage.getItem('user_id')}`,
      `✅ localStorage.user_email: ${localStorage.getItem('user_email')}`,
      `✅ Cookies count: ${cookieData.length}`,
    ];
    setLogs(diagnosticLogs);
  }, [user, isLoading, isAuthenticated]);

  const testRedirect = () => {
    console.log('🧪 Testing redirect to Dashboard...');
    router.push('/Dashboard');
  };

  const forceReload = () => {
    window.location.href = '/Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-4">🔍 Authentication Diagnostic</h1>
          <p className="text-gray-600 mb-4">Real-time authentication state debugging</p>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={testRedirect}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test Router Redirect
            </button>
            <button
              onClick={forceReload}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Force Window Redirect
            </button>
          </div>
        </div>

        {/* useAuth State */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">useAuth Hook State</h2>
          <div className="space-y-2 font-mono text-sm">
            <div className={`p-3 rounded ${user ? 'bg-green-100' : 'bg-red-100'}`}>
              <strong>user:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}
            </div>
            <div className={`p-3 rounded ${!isLoading ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <strong>isLoading:</strong> {isLoading ? 'true' : 'false'}
            </div>
            <div className={`p-3 rounded ${isAuthenticated ? 'bg-green-100' : 'bg-red-100'}`}>
              <strong>isAuthenticated:</strong> {isAuthenticated ? 'true' : 'false'}
            </div>
          </div>
        </div>

        {/* localStorage */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">localStorage Data</h2>
          {Object.keys(localStorageData).length === 0 ? (
            <p className="text-red-600">❌ localStorage is empty!</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(localStorageData).map(([key, value]) => (
                <div key={key} className="border-b pb-2">
                  <div className="font-semibold text-sm text-gray-700">{key}:</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all mt-1">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cookies */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Cookies</h2>
          {cookieData.length === 0 ? (
            <p className="text-red-600">❌ No cookies found!</p>
          ) : (
            <div className="space-y-2">
              {cookieData.map((cookie, index) => (
                <div key={index} className="font-mono text-sm bg-gray-100 p-2 rounded">
                  {cookie}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagnostic Logs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Diagnostic Summary</h2>
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="font-mono text-sm p-2 bg-blue-50 rounded">
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Expected vs Actual */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">✅ Expected State</h2>
          <div className="space-y-2 text-sm">
            <div className={`p-2 rounded ${user ? 'bg-green-100' : 'bg-red-100'}`}>
              {user ? '✅' : '❌'} user object should be present
            </div>
            <div className={`p-2 rounded ${!isLoading ? 'bg-green-100' : 'bg-red-100'}`}>
              {!isLoading ? '✅' : '❌'} isLoading should be false
            </div>
            <div className={`p-2 rounded ${isAuthenticated ? 'bg-green-100' : 'bg-red-100'}`}>
              {isAuthenticated ? '✅' : '❌'} isAuthenticated should be true
            </div>
            <div className={`p-2 rounded ${localStorageData.user_id ? 'bg-green-100' : 'bg-red-100'}`}>
              {localStorageData.user_id ? '✅' : '❌'} user_id in localStorage
            </div>
            <div className={`p-2 rounded ${localStorageData.user_email ? 'bg-green-100' : 'bg-red-100'}`}>
              {localStorageData.user_email ? '✅' : '❌'} user_email in localStorage
            </div>
            <div className={`p-2 rounded ${cookieData.some(c => c.includes('auth_valid')) ? 'bg-green-100' : 'bg-red-100'}`}>
              {cookieData.some(c => c.includes('auth_valid')) ? '✅' : '❌'} auth_valid cookie present
            </div>
          </div>
        </div>

        {/* Console Test */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Console Test Commands</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">Test if redirect works:</h3>
              <code className="block bg-gray-900 text-green-400 p-3 rounded text-xs">
                window.location.href = '/Dashboard'
              </code>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-2">Check what's blocking:</h3>
              <code className="block bg-gray-900 text-green-400 p-3 rounded text-xs whitespace-pre">
{`console.log({
  hasUser: !!localStorage.getItem('user_id'),
  hasEmail: !!localStorage.getItem('user_email'),
  hasCookie: document.cookie.includes('auth_valid'),
  url: window.location.href
});`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


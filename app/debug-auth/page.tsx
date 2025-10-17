'use client';
import { useEffect, useState } from 'react';

export default function DebugAuth() {
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({});
  const [urlHash, setUrlHash] = useState('');

  useEffect(() => {
    // Get all localStorage data
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        data[key] = localStorage.getItem(key) || '';
      }
    }
    setLocalStorageData(data);

    // Get URL hash
    setUrlHash(window.location.hash);

    // Listen for storage changes
    const handleStorageChange = () => {
      const newData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          newData[key] = localStorage.getItem(key) || '';
        }
      }
      setLocalStorageData(newData);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const clearStorage = () => {
    localStorage.clear();
    setLocalStorageData({});
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current URL</h2>
          <p className="font-mono text-sm bg-gray-100 p-2 rounded">
            {typeof window !== 'undefined' ? window.location.href : 'Loading...'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">URL Hash</h2>
          <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
            {urlHash || 'No hash found'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">LocalStorage Data</h2>
            <button
              onClick={clearStorage}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Clear Storage
            </button>
          </div>
          
          {Object.keys(localStorageData).length === 0 ? (
            <p className="text-gray-500">No data in localStorage</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(localStorageData).map(([key, value]) => (
                <div key={key} className="border-b pb-2">
                  <div className="font-semibold text-sm text-gray-700">{key}:</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-x-4">
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Home
            </button>
            <button
              onClick={() => window.location.href = '/Dashboard'}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

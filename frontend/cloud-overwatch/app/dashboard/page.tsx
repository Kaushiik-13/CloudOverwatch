'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [filteredResources, setFilteredResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // 🔹 Scan + Fetch
  const scanAndFetchResources = async () => {
    setLoading(true);
    setMessage('Scanning AWS resources...');

    try {
      const accountId = localStorage.getItem('awsAccountId');
      const email = localStorage.getItem('userEmail');

      if (!accountId || !email) {
        setMessage('No connected AWS account found.');
        setLoading(false);
        return;
      }

      await fetch('http://localhost:3000/api/aws/scan-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, email }),
      });

      const getRes = await fetch('http://localhost:3000/api/aws/get-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      const data = await getRes.json();
      console.log('Fetched Resources:', data);

      if (getRes.ok && data.resources?.length) {
        setResources(data.resources);
        setFilteredResources(data.resources);
        setMessage('');
      } else {
        setResources([]);
        setFilteredResources([]);
        setMessage(data.message || 'No resources found after scan.');
      }
    } catch (error) {
      console.error('Error scanning/fetching resources:', error);
      setMessage('Failed to scan and fetch AWS resources.');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Manual Refresh
  const fetchResources = async () => {
    setLoading(true);
    setMessage('');

    try {
      const accountId = localStorage.getItem('awsAccountId');
      if (!accountId) {
        setMessage('No connected AWS account found.');
        setLoading(false);
        return;
      }

      const res = await fetch('http://localhost:3000/api/aws/get-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      const data = await res.json();
      console.log('Fetched Resources:', data);

      if (res.ok && data.resources) {
        setResources(data.resources);
        setFilteredResources(data.resources);
        setMessage('');
      } else {
        setResources([]);
        setFilteredResources([]);
        setMessage(data.message || 'No resources found.');
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setMessage('Failed to fetch AWS resources.');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Delete Expired Resources
  const deleteExpiredResources = async () => {
    setLoading(true);
    setMessage('Deleting expired resources...');

    try {
      const accountId = localStorage.getItem('awsAccountId');
      if (!accountId) {
        setMessage('No connected AWS account found.');
        setLoading(false);
        return;
      }

      const res = await fetch('http://localhost:3000/api/aws/delete-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      const data = await res.json();
      console.log('Delete Resources Response:', data);

      if (res.ok) {
        setMessage('Expired resources deleted successfully.');
        await fetchResources();
      } else {
        setMessage(data.message || 'Failed to delete resources.');
      }
    } catch (error) {
      console.error('Error deleting resources:', error);
      setMessage('Something went wrong while deleting resources.');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Search filter
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      applyDateFilter(filterType, customStart, customEnd);
      return;
    }

    const lowerTerm = term.toLowerCase();
    const filtered = filteredResources.filter(
      (r) =>
        r.region?.toLowerCase().includes(lowerTerm) ||
        r.resourceType?.toLowerCase().includes(lowerTerm) ||
        r.resourceId?.toLowerCase().includes(lowerTerm) ||
        r.arn?.toLowerCase().includes(lowerTerm)
    );
    setFilteredResources(filtered);
  };

  // 🔹 Date-based filter logic
  const applyDateFilter = (type: string, start?: string, end?: string) => {
    setFilterType(type);
    let filtered = [...resources];
    const today = new Date();

    switch (type) {
      case 'Today':
        filtered = resources.filter((r) => {
          const date = new Date(r.deleteAfter);
          return date.toDateString() === today.toDateString();
        });
        break;
      case 'This Week':
        const weekStart = new Date(today);
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 7);
        filtered = resources.filter((r) => {
          const date = new Date(r.deleteAfter);
          return date >= weekStart && date <= weekEnd;
        });
        break;
      case 'Expired':
        filtered = resources.filter((r) => new Date(r.deleteAfter) < today);
        break;
      case 'Custom':
        if (start && end) {
          const s = new Date(start);
          const e = new Date(end);
          filtered = resources.filter((r) => {
            const d = new Date(r.deleteAfter);
            return d >= s && d <= e;
          });
        }
        break;
      default:
        filtered = resources;
    }

    setFilteredResources(filtered);
    setFilterVisible(false);
  };

  // 🔹 On Load
  useEffect(() => {
    scanAndFetchResources();
  }, []);

  return (
    <div
      className="relative flex h-auto min-h-screen w-full flex-col bg-white overflow-x-hidden"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-solid border-b-[#f2f2f2] px-10 py-3">
        <div className="flex items-center gap-4 text-[#141414]">
          <Link
            href="/dashboard"
            className="text-[#141414] text-lg font-bold hover:text-[#4b4b4b] transition"
          >
            Cloud Overwatch
          </Link>
        </div>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="flex items-center justify-center rounded-lg h-10 px-4 bg-[#141414] text-white text-sm font-bold hover:bg-[#2a2a2a] transition"
        >
          Logout
        </button>
      </header>

      {/* Main */}
      <main className="px-40 flex flex-1 justify-center py-5">
        <div className="flex flex-col max-w-[1100px] w-full">
          {/* Search + Filter */}
          <div className="px-4 py-3 relative">
            <div className="flex w-full items-center h-12 rounded-lg bg-[#f2f2f2]">
              {/* Search */}
              <div className="text-[#757575] flex items-center justify-center pl-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M10 2a8 8 0 015.292 13.708l4 4a1 1 0 01-1.414 1.414l-4-4A8 8 0 1110 2zm0 2a6 6 0 104.472 10.1A6 6 0 0010 4z" />
                </svg>
              </div>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by region, resource type, ARN or ID..."
                className="flex-1 px-4 border-none bg-[#f2f2f2] text-[#141414] placeholder:text-[#757575] focus:outline-none text-base"
              />

              {/* Refresh */}
              <button
                onClick={fetchResources}
                disabled={loading}
                className="flex items-center justify-center h-full px-4 border-l border-[#e0e0e0] text-[#757575] hover:text-[#111827] transition disabled:opacity-70"
                title="Refresh"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"></path>
                </svg>
              </button>

              {/* Filter */}
              <button
                onClick={() => setFilterVisible(!filterVisible)}
                className="flex items-center justify-center h-full px-4 border-l border-[#e0e0e0] text-[#757575] hover:text-[#111827] transition"
                title="Filter by deleteAfter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 01.8 1.6l-6.6 8.8V19l-4 2v-7.6L3.2 4.6A1 1 0 013 4z" />
                </svg>
              </button>

              {/* Delete */}
              <button
                onClick={deleteExpiredResources}
                disabled={loading}
                className="flex items-center justify-center h-full px-4 border-l border-[#e0e0e0] text-red-500 hover:text-red-700 transition disabled:opacity-70"
                title="Delete Expired Resources"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h14M10 11v6m4-6v6M8 7V5a1 1 0 011-1h6a1 1 0 011 1v2m2 0l-1 13a2 2 0 01-2 2H9a2 2 0 01-2-2L6 7z" />
                </svg>
              </button>
            </div>

            {/* Filter Dropdown */}
            {filterVisible && (
              <div className="absolute right-10 mt-2 w-auto bg-white shadow-lg rounded-lg border border-gray-200 p-3 z-10">
                <p className="text-sm font-medium text-gray-700 mb-2">Filter by Delete Date</p>
                <button onClick={() => applyDateFilter('All')} className="block w-full text-left text-gray-700 hover:bg-gray-100 px-3 py-1 rounded">All</button>
                <button onClick={() => applyDateFilter('Today')} className="block w-full text-left text-gray-700 hover:bg-gray-100 px-3 py-1 rounded">Expiring Today</button>
                <button onClick={() => applyDateFilter('This Week')} className="block w-full text-left text-gray-700 hover:bg-gray-100 px-3 py-1 rounded">Expiring This Week</button>
                <button onClick={() => applyDateFilter('Expired')} className="block w-full text-left text-gray-700 hover:bg-gray-100 px-3 py-1 rounded">Expired</button>

                {/* Custom Date Range */}
                <div className="mt-2 border-t pt-2">
                  <label className="text-sm text-gray-600">Custom Range:</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="date"
                      className="border rounded px-2 py-1 text-sm w-full"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                    />
                    <input
                      type="date"
                      className="border rounded px-2 py-1 text-sm w-full"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => applyDateFilter('Custom', customStart, customEnd)}
                    className="w-full mt-2 bg-[#141414] text-white text-sm font-semibold py-1 rounded hover:bg-[#2a2a2a]"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="px-4 py-3">
            <div className="flex overflow-hidden rounded-lg border border-[#e0e0e0] bg-white">
              {loading ? (
                <div className="flex justify-center items-center w-full py-10 text-gray-600 text-sm">{message || 'Loading...'}</div>
              ) : message ? (
                <div className="flex justify-center items-center w-full py-10 text-gray-600 text-sm">{message}</div>
              ) : !filteredResources.length ? (
                <div className="flex justify-center items-center w-full py-10 text-gray-600 text-sm">No matching resources found.</div>
              ) : (
                <table className="flex-1">
                  <thead>
                    <tr className="bg-white text-left text-sm font-medium text-[#141414]">
                      <th className="px-4 py-3 w-[400px]">resourceId</th>
                      <th className="px-4 py-3 w-[400px]">arn</th>
                      <th className="px-4 py-3 w-[400px]">deleteAfter</th>
                      <th className="px-4 py-3 w-[400px]">region</th>
                      <th className="px-4 py-3 w-60">resourceType</th>
                      <th className="px-4 py-3 w-[400px]">scannedAt</th>
                    </tr>
                  </thead>
                  <tbody className="text-[#757575] text-sm">
                    {filteredResources.map((row, i) => (
                      <tr key={i} className="border-t border-t-[#e0e0e0]">
                        <td className="px-4 py-2 w-[400px]">{row.resourceId}</td>
                        <td className="px-4 py-2 w-[400px]">{row.arn}</td>
                        <td className="px-4 py-2 w-[400px]">{row.deleteAfter}</td>
                        <td className="px-4 py-2 w-[400px]">{row.region}</td>
                        <td className="px-4 py-2 w-60">
                          <button className="flex items-center justify-center rounded-lg h-8 px-4 bg-[#f2f2f2] text-[#141414] text-sm font-medium w-full">
                            {row.resourceType}
                          </button>
                        </td>
                        <td className="px-4 py-2 w-[400px]">{row.scannedAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

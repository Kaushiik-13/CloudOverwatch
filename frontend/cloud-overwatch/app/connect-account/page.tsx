'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function ConnectAccountPage() {
  const [email, setEmail] = useState('');
  const [arnRole, setArnRole] = useState('');
  const [externalId, setExternalId] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔹 Generate a unique External ID (only on client to avoid hydration mismatch)
  const generateGuid = () => {
    const guid = `external-id-${crypto.randomUUID().slice(0, 8)}`;
    setExternalId(guid);
  };

  // 🔹 Run only after client hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      generateGuid();
      const savedEmail = localStorage.getItem('userEmail');
      if (savedEmail) setEmail(savedEmail);
    }
  }, []);

  // 🔹 Connect AWS Account API call
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/aws/connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleArn: arnRole,
          externalId: externalId,
          email: email,
        }),
      });

      const data = await response.json();

      if (response.status === 200 || response.status === 201) {
        setMessage(data.message || 'AWS account connected successfully, Check your email for subscription');
        window.location.href = '/dashboard';
        console.log('Connected Account:', data);


        // Store AWS Account ID for later use
        if (data.accountId) {
          localStorage.setItem('awsAccountId', data.accountId);
        }
      } else {
        setMessage(data.message || 'Failed to connect AWS account.');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Dynamic JSON for Drawer
  const trustPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'AllowCloudOverwatchAssumeRole',
        Effect: 'Allow',
        Principal: { AWS: 'arn:aws:iam::104573823385:root' },
        Action: 'sts:AssumeRole',
        Condition: {
          StringEquals: { 'sts:ExternalId': externalId },
        },
      },
    ],
  };

  return (
    <div
      className="relative flex min-h-screen w-full flex-col bg-white overflow-x-hidden"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-solid border-b-[#f2f2f2] px-10 py-3">
        <div className="flex items-center gap-3 text-[#141414]">
          <div className="size-4">
          </div>
          <Link
            href="/dashboard"
            className="text-[#141414] text-lg font-bold leading-tight tracking-[-0.015em] hover:text-[#4b4b4b] transition"
          >
            Cloud Overwatch
          </Link>
        </div>
        <button className="flex min-w-[84px] items-center justify-center rounded-lg h-9 px-4 bg-[#141414] text-white text-sm font-semibold hover:bg-[#2a2a2a] transition">
          Logout
        </button>
      </header>

      {/* Main Form */}
      <main className="flex flex-1 items-start justify-center px-4 pt-20">
        <div className="flex flex-col items-center justify-center bg-white max-w-md w-full p-6">
          <h2 className="text-[#141414] text-3xl font-bold leading-tight text-center mb-8">
            Connect your Account
          </h2>

          <form onSubmit={handleConnect} className="w-full space-y-5">
            {/* Email */}
            <div className="flex flex-col">
              <label className="text-[#141414] text-base font-bold mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-md border border-[#e0e0e0] bg-white px-3 py-2 text-sm text-[#141414] placeholder:text-[#757575] focus:outline-none focus:ring-1 focus:ring-[#141414]/20"
              />
            </div>

            {/* External ID */}
            <div className="flex flex-col">
              <label className="text-[#141414] text-base font-bold mb-2">
                ExternalID
              </label>
              <input
                type="text"
                placeholder="Enter External ID"
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                required
                className="rounded-md border border-[#e0e0e0] bg-white px-3 py-2 text-sm text-[#141414] placeholder:text-[#757575] focus:outline-none focus:ring-1 focus:ring-[#141414]/20"
              />
            </div>

            {/* Auto Generate */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={generateGuid}
                className="flex items-center gap-2 rounded-md bg-[#f5f5f5] text-[#141414] text-xs font-medium px-3 py-1 hover:bg-[#e8e8e8] transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 5V1L8 5l4 4V6c3.309 0 6 2.691 6 6 0 1.236-.375 2.383-1.02 3.338l1.476 1.476C19.322 15.614 20 13.883 20 12c0-4.411-3.589-8-8-8zM6 12c0-1.236.375-2.383 1.02-3.338L5.544 7.186C4.678 8.386 4 10.117 4 12c0 4.411 3.589 8 8 8v4l4-4-4-4v3c-3.309 0-6-2.691-6-6z" />
                </svg>
                Auto Generate &larr;
              </button>
            </div>

            {/* ARN Role */}
            <div className="flex flex-col">
              <label className="text-[#141414] text-base font-bold mb-2">
                ArnRole
              </label>
              <input
                type="text"
                placeholder="Enter ARN Role"
                value={arnRole}
                onChange={(e) => setArnRole(e.target.value)}
                required
                className="rounded-md border border-[#e0e0e0] bg-white px-3 py-2 text-sm text-[#141414] placeholder:text-[#757575] focus:outline-none focus:ring-1 focus:ring-[#141414]/20"
              />
            </div>

            {/* Steps Drawer Button */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => setShowDrawer(true)}
                className="flex items-center gap-2 rounded-md bg-[#f5f5f5] text-[#141414] text-xs font-medium px-3 py-1 hover:bg-[#e8e8e8] transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 22c5.421 0 10-4.579 10-10S17.421 2 12 2 2 6.579 2 12s4.579 10 10 10zm0-18c4.337 0 8 3.663 8 8s-3.663 8-8 8-8-3.663-8-8 3.663-8 8-8zm.5 4v5l4.25 2.5-.75 1.232L11 13V8h1.5z" />
                </svg>
                Steps &larr;
              </button>
            </div>

            {/* Message (Success/Error) */}
            {message && (
              <p
                className={`text-sm text-center ${message.includes('successfully')
                  ? 'text-green-600'
                  : 'text-red-600'
                  }`}
              >
                {message}
              </p>
            )}

            {/* Connect Button */}
            <div className="flex justify-center pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-44 h-9 rounded-md bg-[#141414] text-white text-sm font-semibold hover:bg-[#2a2a2a] transition disabled:opacity-70"
              >
                {loading ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Drawer Overlay */}
      {showDrawer && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowDrawer(false)}
          />
          <div className="fixed right-0 top-0 h-full max-w-[600px] w-fit bg-white shadow-xl z-50 p-8 animate-slideIn overflow-y-auto border-l border-[#e5e5e5]">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-semibold text-[#141414]">
                AWS IAM Role Setup
              </h3>
              <button
                onClick={() => setShowDrawer(false)}
                className="text-gray-600 hover:text-black text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm text-[#141414] leading-relaxed">
              <h4 className="text-[20px] font-extrabold text-[#141414] leading-snug">
                Create IAM Role →{' '}
                <span className="font-black text-[#000]">
                  CloudOverwatchAccessRole
                </span>
              </h4>

              <p className="text-[#555]">
                When creating the role, choose <b>Custom trust policy</b> and paste the following JSON:
              </p>

              <pre className="bg-[#f8f8f8] text-[#141414] text-xs p-3 rounded-md overflow-x-auto border border-[#e0e0e0] min-w-[520px]">
                {JSON.stringify(trustPolicy, null, 2)}
              </pre>

              <p>
                This allows <b>Cloud Overwatch</b> to assume the role securely using the generated External ID.
              </p>

              <h4 className="text-base font-bold text-[#141414] pt-4">
                Attach Permission Policy:
              </h4>

              <p className="text-[#555]">Attach the AWS-managed policy:</p>

              <pre className="bg-[#f8f8f8] text-[#141414] text-xs p-3 rounded-md overflow-x-auto border border-[#e0e0e0] min-w-[520px]">
                ReadOnlyAccess    PowerUserAccess
              </pre>

              <p>
                This grants <b>Cloud Overwatch</b> read-only access to your AWS resources such as EC2, S3, RDS, and more.
              </p>
              <h4 className="text-base font-bold text-[#141414] pt-4">
                Add Names & Tags:
              </h4>
              <pre className="bg-[#f8f8f8] text-[#141414] text-xs p-3 rounded-md overflow-x-auto border border-[#e0e0e0] min-w-[520px]">
                overwatch-delete-after : 2025-10-24
              </pre>

            </div>
          </div>
        </>
      )}

      {/* Drawer Animation */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0%);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

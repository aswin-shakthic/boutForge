import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-navy">404</h1>
        <p className="text-gray-500 mt-2">Page not found</p>
        <Link href="/dashboard" className="btn-primary inline-block mt-6">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

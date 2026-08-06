export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-navy">404</h1>
        <p className="text-gray-500 mt-2">Page not found</p>
        <a href="/login" className="btn-primary inline-block mt-6">
          Go to Login
        </a>
      </div>
    </div>
  );
}

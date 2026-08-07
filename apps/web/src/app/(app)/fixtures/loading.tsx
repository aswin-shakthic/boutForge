export default function FixturesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-32 rounded bg-gray-200" />
      <div className="h-4 w-64 rounded bg-gray-100" />
      <div className="space-y-8">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="space-y-4">
            <div className="h-6 w-48 rounded bg-gray-200" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="card h-32 bg-gray-50" />
              <div className="card h-32 bg-gray-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

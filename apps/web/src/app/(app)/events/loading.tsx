export default function EventsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-32 rounded bg-gray-200" />
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="card h-24 bg-gray-50" />
        ))}
      </div>
    </div>
  );
}

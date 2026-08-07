export default function EventDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-28 rounded bg-gray-200" />
      <div className="card space-y-4">
        <div className="h-8 w-2/3 max-w-md rounded bg-gray-200" />
        <div className="h-4 w-1/2 max-w-sm rounded bg-gray-100" />
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded bg-gray-100" />
          <div className="h-9 w-24 rounded bg-gray-100" />
        </div>
        <div className="h-40 rounded-lg bg-gray-50" />
      </div>
    </div>
  );
}

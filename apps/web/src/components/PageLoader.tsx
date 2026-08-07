type PageLoaderProps = {
  label?: string;
  inline?: boolean;
};

export function PageLoader({ label = "Loading…", inline = false }: PageLoaderProps) {
  return (
    <div
      className={
        inline
          ? "flex flex-col items-center gap-3 py-4"
          : "flex min-h-[40vh] flex-col items-center justify-center gap-3 py-12"
      }
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="page-loader-spinner" aria-hidden="true" />
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

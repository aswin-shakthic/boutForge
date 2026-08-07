import Link from "next/link";
import { APP_NAME } from "@boutforge/shared";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-navy px-4 py-8 sm:py-12">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_#fff_1px,_transparent_1px)] bg-[length:24px_24px]" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{APP_NAME}</h1>
          <p className="text-white/60 mt-2 text-sm">Boxing Fixture Management</p>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold text-navy mb-1">{title}</h2>
          {subtitle && <p className="text-gray-500 text-sm mb-6">{subtitle}</p>}
          {!subtitle && <div className="mb-6" />}
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="text-boxing hover:underline text-sm">
      {children}
    </Link>
  );
}

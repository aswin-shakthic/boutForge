const LOCAL_APP_URL = "http://localhost:3000";

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  } catch {
    return url.includes("localhost") || url.includes("127.0.0.1");
  }
}

function vercelProductionUrl(): string | null {
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) {
    return normalizeBaseUrl(`https://${productionHost}`);
  }

  if (process.env.VERCEL_ENV === "production") {
    const vercelUrl = process.env.VERCEL_URL?.trim();
    if (vercelUrl) return normalizeBaseUrl(`https://${vercelUrl}`);
  }

  return null;
}

function configuredAppUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) return null;
  return normalizeBaseUrl(configured);
}

/**
 * Canonical public app URL.
 * In the browser we always use the current origin so auth emails match prod when
 * NEXT_PUBLIC_APP_URL was copied from local .env.example.
 */
export function getPublicAppUrl(): string {
  if (typeof window !== "undefined") {
    return normalizeBaseUrl(window.location.origin);
  }

  const configured = configuredAppUrl();
  if (configured && !isLocalhostUrl(configured)) {
    return configured;
  }

  const vercel = vercelProductionUrl();
  if (vercel) return vercel;

  if (configured) return configured;

  return LOCAL_APP_URL;
}

function resolveFromRequestHeaders(request: Request): string | null {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    const host = forwardedHost.split(",")[0]?.trim();
    if (host) return normalizeBaseUrl(`${forwardedProto}://${host}`);
  }

  const host = request.headers.get("host");
  if (host) {
    const proto = host.includes("localhost") ? "http" : "https";
    return normalizeBaseUrl(`${proto}://${host}`);
  }

  try {
    return normalizeBaseUrl(new URL(request.url).origin);
  } catch {
    return null;
  }
}

/** Resolve app URL from an incoming request (auth callback, server routes). */
export function getRequestAppUrl(request: Request): string {
  const fromRequest = resolveFromRequestHeaders(request);
  if (fromRequest && !isLocalhostUrl(fromRequest)) {
    return fromRequest;
  }

  const configured = configuredAppUrl();
  if (configured && !isLocalhostUrl(configured)) {
    return configured;
  }

  const vercel = vercelProductionUrl();
  if (vercel) return vercel;

  if (fromRequest) return fromRequest;
  if (configured) return configured;

  return LOCAL_APP_URL;
}

export function authCallbackUrl(nextPath?: string): string {
  const base = getPublicAppUrl();
  const callback = `${base}/auth/callback`;
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    return `${callback}?next=${encodeURIComponent(nextPath)}`;
  }
  return callback;
}

export function resetPasswordUrl(): string {
  return `${getPublicAppUrl()}/reset-password`;
}

export function signupInviteUrl(token: string): string {
  return `${getPublicAppUrl()}/signup?invite=${encodeURIComponent(token)}`;
}

/** Production URL for Supabase dashboard Site URL (not localhost). */
export function getSupabaseSiteUrl(): string {
  const configured = configuredAppUrl();
  if (configured && !isLocalhostUrl(configured)) {
    return configured;
  }

  const vercel = vercelProductionUrl();
  if (vercel) return vercel;

  return configured ?? LOCAL_APP_URL;
}

/** URLs that must be allowlisted in Supabase → Authentication → URL configuration. */
export function supabaseRedirectAllowlist(): string[] {
  const production = getSupabaseSiteUrl();
  const urls = new Set<string>([
    production,
    `${production}/auth/callback`,
    `${production}/reset-password`,
    `${production}/login`,
    LOCAL_APP_URL,
    `${LOCAL_APP_URL}/auth/callback`,
    `${LOCAL_APP_URL}/reset-password`,
    `${LOCAL_APP_URL}/login`,
  ]);

  if (typeof window !== "undefined") {
    const current = normalizeBaseUrl(window.location.origin);
    urls.add(current);
    urls.add(`${current}/auth/callback`);
    urls.add(`${current}/reset-password`);
    urls.add(`${current}/login`);
  }

  return Array.from(urls);
}

export function isMisconfiguredProductionAppUrl(): boolean {
  if (process.env.VERCEL_ENV !== "production") return false;
  const configured = configuredAppUrl();
  return Boolean(configured && isLocalhostUrl(configured));
}

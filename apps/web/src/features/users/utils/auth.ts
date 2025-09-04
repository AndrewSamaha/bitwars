// lib/auth.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from './jwt';
import { NextResponse } from 'next/server';

type AuthPayload = {
  playerId: string;
  name: string;
  normalizedName: string;
  exp?: number;
  iat?: number;
};

/**
 * Server-only auth guard for pages and actions.
 *
 * Use at the top of Server Components or Server Actions to ensure the user is
 * authenticated before continuing. If the JWT cookie is missing or invalid,
 * this calls Next.js redirect (which throws) to navigate to the provided path
 * (defaults to '/').
 *
 * Use requireAuthOr401 for API route handlers (files under app/.../route.ts).
 * 
 * Behavior summary:
 * - Reads the player_token httpOnly cookie.
 * - Verifies the JWT (HS256) with the server secret.
 * - On failure: redirects to the given path.
 * - On success: returns the decoded payload.
 *
 * Examples:
 *
 * ```ts
 * import { requireAuthOrRedirect } from '@/features/users/utils/auth';
 *
 * export default async function Page() {
 *   const auth = await requireAuthOrRedirect('/');
 *   return <div>Welcome, {`{`}{auth.name}{`}`}</div>;
 * }
 * ```
 *
 */
export async function requireAuthOrRedirect(redirectTo: string = '/') : Promise<AuthPayload> {
  const token = (await cookies()).get('player_token')?.value;
  if (!token) redirect(redirectTo); // throws to stop execution

  try {
    const payload = await verifyToken(token);
    if (!payload) redirect(redirectTo);
    return payload as AuthPayload;
  } catch {
    redirect(redirectTo);
  }
}

/**
 * API-route auth helper that returns 401 Unauthorized when not authenticated.
 *
 * Intended usage: call at the top of API route handlers (files under
 * app/.../route.ts). This function reads and verifies the player_token cookie.
 * If missing or invalid, it returns a NextResponse JSON with status 401.
 * If valid, it returns the decoded auth payload and no response.
 *
 * Return shape:
 * - { auth: null,  res: NextResponse } when unauthorized (status 401)
 * - { auth: object, res: null } when authorized (payload is the decoded JWT)
 *
 * Example (API route handler):
 * ```ts
 * import { NextResponse } from 'next/server';
 * import { requireAuthOr401 } from '@/features/users/utils/auth';
 *
 * export async function GET() {
 *   const { auth, res } = await requireAuthOr401();
 *   if (res) return res; // 401 when not authenticated
 *
 *   // authenticated request logic here, e.g. use auth.playerId
 *   return NextResponse.json({ ok: true, playerId: (auth as any).playerId });
 * }
 * ```
 */
export async function requireAuthOr401() {
    const token = (await cookies()).get('player_token')?.value;
    if (!token) return { 
        auth: null,
        res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  
    try {
      const payload = await verifyToken(token);
      return {
        auth: payload,
        res: null
      };
    } catch {
      return {
        auth: null,
        res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      };
    }
  }

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import React from 'react';

const SECRET = process.env.PLAYER_AUTH_SECRET;

async function verifyToken(token: string) {
  if (!SECRET) {
    console.error('PLAYER_AUTH_SECRET is not set');
    return null;
  }
  try {
    const encoder = new TextEncoder();
    const { payload } = await jwtVerify(token, encoder.encode(SECRET), {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (err) {
    // Token invalid or expired
    return null;
  }
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('player_token')?.value;

  if (!token) {
    console.log('[play/layout] redirect: no player_token cookie');
    redirect('/');
  }

  const payload = await verifyToken(token!);
  if (!payload) {
    console.log('[play/layout] redirect: token verify failed (invalid or expired)');
    redirect('/');
  }
  console.log('[play/layout] auth ok', { playerId: (payload as { playerId?: string }).playerId });

  // Optionally, you could pass payload via context or props if needed
  return <>{children}</>;
}

import { jwtVerify } from 'jose';

const SECRET = process.env.PLAYER_AUTH_SECRET;

export async function verifyToken(token: string) {
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
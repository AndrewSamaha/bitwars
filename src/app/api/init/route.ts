import { NextResponse } from 'next/server';

import init from '@/lib/db/init/init';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const result  = await init()
    return NextResponse.json({ result }, { status: 200 });
  } catch (err: any) {
    const msg = String(err?.message ?? err);
    if (!msg.includes("Index already exists")) throw err;
    return NextResponse.json({ msg }, { status: 500 });
  }
}
  
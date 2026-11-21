import { NextResponse } from 'next/server';
import { getServices } from '@/server/context';

export async function GET() {
  try {
    const { player } = getServices();
    const last = player.getLastWatched();
    return NextResponse.json(last);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

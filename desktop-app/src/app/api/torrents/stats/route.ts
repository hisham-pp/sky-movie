import { NextResponse } from 'next/server';
import { getServices } from '@/server/context';

export async function GET() {
  try {
    const { torrent } = getServices();
    const stats = torrent.stats();
    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

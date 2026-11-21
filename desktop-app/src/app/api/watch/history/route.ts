import { NextResponse } from 'next/server';
import { getServices } from '@/server/context';

export async function GET() {
  try {
    const { player } = getServices();
    const history = player.getWatchHistory();
    return NextResponse.json(history);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { player } = getServices();
    player.clearWatchHistory();
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse, type NextRequest } from 'next/server';
import { getServices } from '@/server/context';

export async function GET() {
  try {
    const { playlist } = getServices();
    const lists = playlist.getPlaylists();
    return NextResponse.json(lists);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playlist } = getServices();
    const created = playlist.createPlaylist(body);
    return NextResponse.json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse, type NextRequest } from 'next/server';
import { getServices } from '@/server/context';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { playlist } = getServices();
    playlist.addToPlaylist({ playlistId: Number(id), ...body });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

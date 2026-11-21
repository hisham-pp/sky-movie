import { NextResponse, type NextRequest } from 'next/server';
import { getServices } from '@/server/context';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params;
    const { playlist } = getServices();
    playlist.removeFromPlaylist({ playlistId: Number(id), itemId: Number(itemId) });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

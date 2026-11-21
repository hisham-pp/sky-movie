import { NextResponse, type NextRequest } from 'next/server';
import { getServices } from '@/server/context';

export async function GET() {
  try {
    const { torrent } = getServices();
    const list = torrent.list();
    return NextResponse.json(list);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { torrent } = getServices();
    const info = await torrent.addMagnet(body);
    return NextResponse.json(info);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteFiles = searchParams.get('deleteFiles') === 'true';
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { torrent } = getServices();
    if (deleteFiles) {
      await torrent.deleteFiles(id);
    } else {
      await torrent.remove(id);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

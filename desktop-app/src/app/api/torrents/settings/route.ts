import { NextResponse, type NextRequest } from 'next/server';
import { getServices } from '@/server/context';

export async function GET() {
  try {
    const { torrent } = getServices();
    const settings = torrent.getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { torrent } = getServices();
    const settings = torrent.updateSettings(body);
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

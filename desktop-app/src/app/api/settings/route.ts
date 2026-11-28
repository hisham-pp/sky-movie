import { NextResponse, type NextRequest } from 'next/server';
import { getServices } from '@/server/context';

export async function GET() {
  try {
    const { settings } = getServices();
    const s = settings.getSettings();
    return NextResponse.json(s);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = getServices();
    const updated = settings.updateSettings(body);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

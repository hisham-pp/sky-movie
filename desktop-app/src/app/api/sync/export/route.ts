import { NextResponse, type NextRequest } from 'next/server';
import { getServices } from '@/server/context';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { sync } = getServices();
    const result = await sync.exportLibrary(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

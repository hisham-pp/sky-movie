import { NextResponse, type NextRequest } from 'next/server';
import { getServices } from '@/server/context';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metadata } = getServices();
    const applied = await metadata.applyMovieMetadata(body);
    return NextResponse.json(applied);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

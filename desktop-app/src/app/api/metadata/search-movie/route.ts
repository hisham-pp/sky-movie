import { NextResponse, type NextRequest } from 'next/server';
import { getServices } from '@/server/context';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metadata } = getServices();
    const results = await metadata.searchMovieMetadata(body);
    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

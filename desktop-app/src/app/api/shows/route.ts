import { NextResponse, type NextRequest } from 'next/server';
import { getServices } from '@/server/context';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') ?? '';
    const { catalog } = getServices();
    const shows = catalog.getShows(query);
    return NextResponse.json(shows);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

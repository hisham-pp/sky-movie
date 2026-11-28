import { NextResponse, type NextRequest } from 'next/server';
import { getServices } from '@/server/context';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { catalog } = getServices();
    const movie = catalog.getMovieById(Number(id));
    return NextResponse.json(movie);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse, type NextRequest } from 'next/server';
import { getServices } from '@/server/context';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { catalog } = getServices();
    const show = catalog.getShowById(Number(id));
    return NextResponse.json(show);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

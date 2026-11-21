import { NextResponse, type NextRequest } from 'next/server';
import { getServices } from '@/server/context';

export async function POST(request: NextRequest) {
  try {
    const { fileId, ignored } = await request.json();
    const { catalog } = getServices();
    if (ignored) {
      catalog.markFileAsIgnored(fileId);
    } else {
      catalog.unmarkFileAsIgnored(fileId);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

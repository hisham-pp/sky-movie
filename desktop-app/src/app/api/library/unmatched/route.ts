import { NextResponse } from 'next/server';
import { getServices } from '@/server/context';

export async function GET() {
  try {
    const { catalog } = getServices();
    const unmatched = catalog.getUnmatchedFiles();
    return NextResponse.json(unmatched);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

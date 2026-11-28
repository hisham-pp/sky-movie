import { NextResponse } from 'next/server';
import { getServices } from '@/server/context';

export async function GET() {
  try {
    const { scanner } = getServices();
    const summary = scanner.getSummary();
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

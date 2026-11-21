import { NextResponse } from 'next/server';
import { getServices } from '@/server/context';

export async function POST() {
  try {
    const { maintenance } = getServices();
    const result = await maintenance.clearLocalLibraryData();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse, type NextRequest } from 'next/server';
import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetDir = body.targetDir || homedir();
    // Return subfolders of targetDir so user can pick
    const entries = readdirSync(targetDir, { withFileTypes: true });
    const folders = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => join(targetDir, e.name));
    return NextResponse.json({ current: targetDir, folders });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

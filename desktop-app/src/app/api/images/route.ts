import { NextResponse, type NextRequest } from 'next/server';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPath = searchParams.get('path');
    if (!rawPath) {
      return new NextResponse('Path parameter required', { status: 400 });
    }

    const absolutePath = decodeURIComponent(rawPath);
    if (!existsSync(absolutePath)) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const data = await readFile(absolutePath);
    const ext = absolutePath.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=604800, immutable'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new NextResponse(message, { status: 500 });
  }
}

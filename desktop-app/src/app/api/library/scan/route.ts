import { NextResponse, type NextRequest } from 'next/server';
import { getServices } from '@/server/context';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scanner, settings } = getServices();
    const currentSettings = settings.getSettings();

    if (body.paths && Array.isArray(body.paths)) {
      const results = [];
      for (const p of body.paths) {
        if (!p) continue;
        const res = await scanner.scanLibrary(p, {
          mediaKind: body.mediaKind ?? currentSettings.defaultScanMode,
          matcherStrategy: body.matcherStrategy ?? currentSettings.defaultMatcherStrategy,
          extractFileMetadata: body.extractFileMetadata ?? currentSettings.extractFileMetadata
        });
        results.push(res);
      }
      return NextResponse.json(results);
    }

    if (body.path) {
      const res = await scanner.scanLibrary(body.path, {
        mediaKind: body.mediaKind ?? currentSettings.defaultScanMode,
        matcherStrategy: body.matcherStrategy ?? currentSettings.defaultMatcherStrategy,
        extractFileMetadata: body.extractFileMetadata ?? currentSettings.extractFileMetadata
      });
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: 'No path provided' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

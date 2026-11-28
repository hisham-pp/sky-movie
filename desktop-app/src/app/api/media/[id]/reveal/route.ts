import { NextResponse, type NextRequest } from 'next/server';
import { getServices } from '@/server/context';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { catalog } = getServices();
    const mediaFile = catalog.getMediaFile(Number(id));
    if (mediaFile) {
      try {
        const { exec } = await import('node:child_process');
        if (process.platform === 'win32') {
          exec(`explorer.exe /select,"${mediaFile.absolutePath.replace(/"/g, '\\"')}"`);
        } else if (process.platform === 'darwin') {
          exec(`open -R "${mediaFile.absolutePath.replace(/"/g, '\\"')}"`);
        }
      } catch {}
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

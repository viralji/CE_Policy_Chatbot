import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:4001';

function hasDevBypassCookie(request: NextRequest): boolean {
  const cookie = request.headers.get('cookie') || '';
  return cookie.includes('dev-bypass-auth=true');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getServerSession(authOptions);
  const devBypass = hasDevBypassCookie(request);

  if (!session?.user && !devBypass) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { path } = await params;
  const pathStr = path.join('/');
  const url = `${BACKEND_URL}/files/${pathStr}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: res.status });
    }
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const blob = await res.blob();
    return new NextResponse(blob, {
      status: 200,
      headers: { 'Content-Type': contentType },
    });
  } catch (err) {
    console.error('Proxy file failed:', err);
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 502 });
  }
}

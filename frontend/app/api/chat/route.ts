import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:4001';
// Use env secret when set; otherwise dev-secret for local dev (backend accepts it from localhost when unset)
const INTERNAL_PROXY_SECRET = process.env.INTERNAL_PROXY_SECRET || 'dev-secret';

function hasDevBypassCookie(request: Request): boolean {
  const cookie = request.headers.get('cookie') || '';
  return cookie.includes('dev-bypass-auth=true');
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const devBypass = hasDevBypassCookie(request);

  if (!session?.user && !devBypass) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = session?.user
    ? ((session.user as { email?: string }).email ?? session.user?.name ?? '')
    : 'dev@local';
  const name = session?.user?.name ?? email;

  try {
    const body = await request.text();
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Proxy-Secret': INTERNAL_PROXY_SECRET,
        'X-User-Email': email,
        'X-User-Name': name,
      },
      body,
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('Proxy to backend failed:', err);
    return NextResponse.json(
      { error: 'Failed to reach backend' },
      { status: 502 }
    );
  }
}

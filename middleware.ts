import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

function unauthorizedJson() {
  return NextResponse.json({ok: false, error: 'unauthorized'}, {status: 401});
}

function unauthorizedBasic() {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      // Triggers the browser login prompt.
      'WWW-Authenticate': 'Basic realm="Jarvis Dashboard"',
    },
  });
}

function getBearerToken(req: NextRequest) {
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

function hasValidBasicAuth(req: NextRequest) {
  const user = process.env.DASH_USER;
  const pass = process.env.DASH_PASS;
  if (!user || !pass) return true; // Auth disabled.

  const header = req.headers.get('authorization') || '';
  const match = header.match(/^Basic\s+(.+)$/i);
  if (!match) return false;

  try {
    const decoded = Buffer.from(match[1], 'base64').toString('utf8');
    const [u, p] = decoded.split(':');
    return u === user && p === pass;
  } catch {
    return false;
  }
}

export function middleware(req: NextRequest) {
  const {pathname} = req.nextUrl;

  const isUpgrade = (req.headers.get('upgrade') || '').toLowerCase() === 'websocket';
  const isNextInternal = pathname.startsWith('/_next/') || pathname === '/_next';
  const isPublicAsset = pathname === '/favicon.ico' || pathname === '/sw.js';

  // Don't interfere with dev websocket/HMR or internal Next assets.
  if (isUpgrade || isNextInternal || isPublicAsset) {
    return NextResponse.next();
  }

  // Global Basic Auth when enabled (protects UI + API).
  if (!hasValidBasicAuth(req)) {
    // For API callers we return JSON, for pages we return Basic challenge.
    if (pathname.startsWith('/api/')) return unauthorizedJson();
    return unauthorizedBasic();
  }

  // Extra Bearer protection for agent state writes (optional, still supported).
  const agentMatch = pathname.match(/^\/api\/agents\/(jarvis|claw)\/state$/);
  if (agentMatch && req.method === 'POST') {
    const agentId = agentMatch[1];
    const token = getBearerToken(req);

    const jarvisKey = process.env.JARVIS_DASHBOARD_KEY;
    const clawKey = process.env.CLAW_DASHBOARD_KEY;

    if (agentId === 'jarvis') {
      if (!jarvisKey || !token || token !== jarvisKey) return unauthorizedJson();
    }
    if (agentId === 'claw') {
      if (!clawKey || !token || token !== clawKey) return unauthorizedJson();
    }

    return NextResponse.next();
  }

  // Protect letters API (both read/write) (optional, still supported).
  if (pathname.startsWith('/api/bridge/letters')) {
    const token = getBearerToken(req);
    const jarvisKey = process.env.JARVIS_DASHBOARD_KEY;
    const clawKey = process.env.CLAW_DASHBOARD_KEY;
    if (!token || (token !== jarvisKey && token !== clawKey)) return unauthorizedJson();
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Exclude Next internals from middleware (important for dev HMR websockets).
  matcher: ['/((?!_next/).*)'],
};

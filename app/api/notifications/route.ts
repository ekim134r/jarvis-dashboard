import {NextResponse} from 'next/server';
import {readDb, writeDb} from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const onlyUnread = url.searchParams.get('unread') === '1';

  const db = await readDb();
  const list = (db.notifications ?? []).filter((n) => (onlyUnread ? !n.read : true));

  return NextResponse.json({
    unread: (db.notifications ?? []).filter((n) => !n.read).length,
    notifications: list,
  });
}

export async function POST(request: Request) {
  // Mark as read.
  const payload = (await request.json().catch(() => null)) as null | {ids?: string[]; all?: boolean};
  const db = await readDb();
  const ids = payload?.ids ?? [];

  if (payload?.all) {
    (db.notifications ?? []).forEach((n) => (n.read = true));
  } else if (ids.length > 0) {
    const idSet = new Set(ids);
    (db.notifications ?? []).forEach((n) => {
      if (idSet.has(n.id)) n.read = true;
    });
  }

  await writeDb(db);
  return NextResponse.json({ok: true});
}

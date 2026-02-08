import {randomUUID} from 'crypto';
import type {Database, Notification, NotificationLevel} from './types';

export function ensureNotifications(db: Database) {
  if (!db.notifications) db.notifications = [];
}

export function pushNotification(db: Database, input: {
  level?: NotificationLevel;
  source: string;
  type: string;
  title: string;
  body?: string;
}) {
  ensureNotifications(db);

  const now = new Date().toISOString();
  const n: Notification = {
    id: randomUUID(),
    level: input.level ?? 'info',
    source: input.source,
    type: input.type,
    title: input.title,
    body: input.body,
    read: false,
    createdAt: now,
  };

  db.notifications!.unshift(n);
  // Keep it bounded.
  db.notifications = db.notifications!.slice(0, 200);

  return n;
}

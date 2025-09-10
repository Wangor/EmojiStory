export type ReportPayload = {
  targetId: string;
  targetType: 'movie' | 'comment';
  reason: string;
  details?: string;
  reporterId?: string;
};

export async function submitReport(payload: ReportPayload) {
  const res = await fetch('/api/moderation', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error('Failed to submit report');
  }
  return res.json();
}

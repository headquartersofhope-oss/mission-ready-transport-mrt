import { createClient } from 'npm:@base44/sdk@0.8.25';

// SCHEDULED. Walks OutboundIntegrationQueue and retries pending/failed items
// with exponential backoff. Caps attempts at 8 then dead-letters.
const MAX_ATTEMPTS = 8;
const BATCH = 50;

Deno.serve(async (_req) => {
  const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID') || '',
    apiKey: Deno.env.get('BASE44_SERVICE_ROLE_KEY') || '',
  });

  const pending = await base44.entities.OutboundIntegrationQueue.filter(
    { status: 'pending' },
    'created_at',
    BATCH
  );

  const results: any[] = [];

  for (const item of pending) {
    const nextAttempt = (item.attempts || 0) + 1;

    // Exponential backoff: skip if last_attempt_at is recent
    if (item.last_attempt_at) {
      const wait = Math.min(60 * 60 * 1000, Math.pow(2, item.attempts || 0) * 30 * 1000);
      const elapsed = Date.now() - new Date(item.last_attempt_at).getTime();
      if (elapsed < wait) continue;
    }

    let baseUrl = '';
    if (item.target_app === 'pathways') baseUrl = Deno.env.get('PATHWAYS_APP_BASE_URL') || '';
    else if (item.target_app === 'housing') baseUrl = Deno.env.get('HOUSING_APP_BASE_URL') || '';
    else if (item.target_app === 'drive') baseUrl = Deno.env.get('DRIVE_APP_BASE_URL') || '';

    try {
      const cfgs = await base44.entities.IntegrationConfig.filter(
        { app_name: item.target_app },
        '-created_date',
        1
      );
      if (cfgs.length > 0 && cfgs[0].base_url) baseUrl = cfgs[0].base_url;
      if (cfgs.length > 0 && cfgs[0].enabled === false) continue;
    } catch (_) {}

    if (!baseUrl) {
      await base44.entities.OutboundIntegrationQueue.update(item.id, {
        attempts: nextAttempt,
        last_attempt_at: new Date().toISOString(),
        last_error: 'no_base_url',
        status: nextAttempt >= MAX_ATTEMPTS ? 'dead_lettered' : 'pending',
      });
      results.push({ id: item.id, result: 'no_base_url' });
      continue;
    }

    const url = `${baseUrl.replace(/\/$/, '')}${item.endpoint_path}`;
    const secret = Deno.env.get('MRT_OUTBOUND_SECRET') || '';

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-mrt-secret': secret },
        body: JSON.stringify(item.payload || {}),
      });
      if (resp.ok) {
        await base44.entities.OutboundIntegrationQueue.update(item.id, {
          status: 'succeeded',
          attempts: nextAttempt,
          last_attempt_at: new Date().toISOString(),
          succeeded_at: new Date().toISOString(),
          last_error: null,
        });
        results.push({ id: item.id, result: 'succeeded' });
      } else {
        const text = await resp.text();
        await base44.entities.OutboundIntegrationQueue.update(item.id, {
          status: nextAttempt >= MAX_ATTEMPTS ? 'dead_lettered' : 'pending',
          attempts: nextAttempt,
          last_attempt_at: new Date().toISOString(),
          last_error: `${resp.status}: ${text.slice(0, 500)}`,
        });
        results.push({ id: item.id, result: `http_${resp.status}` });
      }
    } catch (err) {
      await base44.entities.OutboundIntegrationQueue.update(item.id, {
        status: nextAttempt >= MAX_ATTEMPTS ? 'dead_lettered' : 'pending',
        attempts: nextAttempt,
        last_attempt_at: new Date().toISOString(),
        last_error: `network: ${(err as Error).message}`,
      });
      results.push({ id: item.id, result: 'network_error' });
    }
  }

  return Response.json({ success: true, processed: results.length, results });
});

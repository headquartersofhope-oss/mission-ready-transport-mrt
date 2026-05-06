import { createClient } from 'npm:@base44/sdk@0.8.25';

// Helper. Takes global_resident_id (Pathways master) and returns the matching
// MRT Participant (or null). Used by inbound functions and dashboards.
Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    const global_resident_id =
      body.global_resident_id || url.searchParams.get('global_resident_id') || '';
    if (!global_resident_id) {
      return Response.json({ error: 'global_resident_id required' }, { status: 400 });
    }

    const base44 = createClient({
      appId: Deno.env.get('BASE44_APP_ID') || '',
      apiKey: Deno.env.get('BASE44_SERVICE_ROLE_KEY') || '',
    });

    const matches = await base44.entities.Participant.filter(
      { pathways_global_resident_id: global_resident_id },
      '-created_date',
      1
    );

    if (matches.length === 0) {
      return Response.json({ success: true, found: false, participant: null });
    }
    return Response.json({ success: true, found: true, participant: matches[0] });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
});

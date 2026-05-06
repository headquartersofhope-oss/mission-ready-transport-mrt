import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Status transitions that should trigger an outbound notify to Pathways.
const NOTIFY_STATUSES = new Set([
  'driver_assigned',
  'en_route',
  'rider_picked_up',
  'dropped_off',
  'completed',
  'cancelled',
  'no_show',
]);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, entity, filters, id, data } = body;

    const entityMap = {
      participants: 'Participant',
      transport_requests: 'TransportRequest',
      providers: 'TransportProvider',
      recurring_plans: 'RecurringTransportPlan',
    };

    const entityName = entityMap[entity];
    if (!entityName) {
      return Response.json({ error: `Unknown entity: ${entity}` }, { status: 400 });
    }

    const entityClient = base44.entities[entityName];

    switch (action) {
      case 'list': {
        const items = filters
          ? await entityClient.filter(filters, '-created_date', 500)
          : await entityClient.list('-created_date', 500);
        return Response.json({ success: true, data: items, count: items.length });
      }

      case 'get': {
        if (!id) return Response.json({ error: 'ID required' }, { status: 400 });
        const items = await entityClient.filter({ id }, '-created_date', 1);
        if (items.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
        return Response.json({ success: true, data: items[0] });
      }

      case 'create': {
        if (!data) return Response.json({ error: 'Data required' }, { status: 400 });
        const created = await entityClient.create(data);
        // Fire-and-forget Pathways + Housing notify on TransportRequest create with status
        if (entity === 'transport_requests' && created?.status && NOTIFY_STATUSES.has(created.status)) {
          fireAndForgetNotify(created.id, created.status);
          fireAndForgetHousing(created.id, created.status);
        }
        return Response.json({ success: true, data: created });
      }

      case 'update': {
        if (!id || !data) return Response.json({ error: 'ID and data required' }, { status: 400 });
        const updated = await entityClient.update(id, data);
        // Fire-and-forget on status change
        if (entity === 'transport_requests' && data?.status && NOTIFY_STATUSES.has(data.status)) {
          fireAndForgetNotify(updated.id, data.status);
          fireAndForgetHousing(updated.id, data.status);
        }
        return Response.json({ success: true, data: updated });
      }

      case 'delete': {
        if (!id) return Response.json({ error: 'ID required' }, { status: 400 });
        await entityClient.delete(id);
        return Response.json({ success: true });
      }

      default:
        return Response.json(
          { error: `Unknown action: ${action}. Use: list, get, create, update, delete` },
          { status: 400 }
        );
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Fire-and-forget: never blocks, never throws.
function fireAndForgetNotify(trip_id: string, status: string) {
  try {
    const base = Deno.env.get('MRT_FUNCTIONS_BASE_URL');
    if (!base) return;
    const url = `${base.replace(/\/$/, '')}/functions/notifyPathwaysOfTrip`;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trip_id, status }),
    }).catch(() => {});
  } catch (_) {}
}

function fireAndForgetHousing(trip_id: string, status: string) {
  try {
    const base = Deno.env.get('MRT_FUNCTIONS_BASE_URL');
    if (!base) return;
    const url = `${base.replace(/\/$/, '')}/functions/notifyHousingOfTransport`;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trip_id, status }),
    }).catch(() => {});
  } catch (_) {}
}

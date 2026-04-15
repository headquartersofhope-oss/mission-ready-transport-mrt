import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { systemSummary } = await req.json();

  const prompt = `You are an expert operations auditor for a nonprofit transportation platform that serves at-risk clients (people transitioning from homelessness, in recovery, or recently incarcerated) to jobs, medical appointments, and social services.

Here is a summary of the current system state:
${JSON.stringify(systemSummary, null, 2)}

Based on this data, provide a professional AI audit analysis. Return a JSON object with these exact fields:
- executive_summary: 2-3 sentence plain-english summary of overall platform health
- dispatch_bottlenecks: array of strings describing scheduling or dispatch inefficiencies
- overload_risks: array of strings describing driver or resource overload risks
- data_quality_concerns: array of strings describing data completeness or accuracy issues
- operational_patterns: array of strings describing notable demand or operational patterns
- service_gap_risks: array of strings describing potential gaps in service delivery
- top_5_priorities: array of exactly 5 strings — the most important things to fix right now, ordered by impact
- readiness_assessment: object with fields dispatch, drivers, vehicles, scheduling, data — each a string rating of "ready", "at risk", or "not ready" plus a brief reason
- risk_level: one of "low", "moderate", "elevated", "critical"`;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: {
      type: 'object',
      properties: {
        executive_summary: { type: 'string' },
        dispatch_bottlenecks: { type: 'array', items: { type: 'string' } },
        overload_risks: { type: 'array', items: { type: 'string' } },
        data_quality_concerns: { type: 'array', items: { type: 'string' } },
        operational_patterns: { type: 'array', items: { type: 'string' } },
        service_gap_risks: { type: 'array', items: { type: 'string' } },
        top_5_priorities: { type: 'array', items: { type: 'string' } },
        readiness_assessment: { type: 'object' },
        risk_level: { type: 'string' },
      }
    }
  });

  return Response.json(result);
});
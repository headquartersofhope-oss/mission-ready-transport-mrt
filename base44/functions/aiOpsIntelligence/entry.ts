import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { mode, data } = body;

  const prompts = {

    dispatch_assistant: `You are an expert transportation dispatcher for a nonprofit serving at-risk clients (homeless, in recovery, recently incarcerated).

Open rides to review:
${JSON.stringify(data.openRides, null, 2)}

Available drivers:
${JSON.stringify(data.drivers, null, 2)}

Available vehicles:
${JSON.stringify(data.vehicles, null, 2)}

Analyze these open rides and provide dispatch recommendations. Return JSON:
{
  "driver_assignments": [{"ride_id": string, "participant_name": string, "recommended_driver": string, "reason": string, "confidence": "high"|"medium"|"low"}],
  "vehicle_assignments": [{"ride_id": string, "participant_name": string, "recommended_vehicle": string, "reason": string}],
  "high_risk_rides": [{"ride_id": string, "participant_name": string, "risk": string, "action": string}],
  "grouping_opportunities": [{"rides": [string], "reason": string, "estimated_savings": string}],
  "dispatch_order": [{"position": number, "ride_id": string, "participant_name": string, "reason": string}],
  "escalation_needed": [{"ride_id": string, "participant_name": string, "reason": string}],
  "summary": string
}`,

    load_balance: `You are an operations analyst for a nonprofit transportation service.

Driver workload data:
${JSON.stringify(data.driverWorkloads, null, 2)}

Vehicle utilization data:
${JSON.stringify(data.vehicleUtilization, null, 2)}

Time block distribution:
${JSON.stringify(data.timeBlocks, null, 2)}

Analyze workload balance and return JSON:
{
  "overloaded_drivers": [{"driver": string, "ride_count": number, "recommendation": string}],
  "underutilized_drivers": [{"driver": string, "ride_count": number, "recommendation": string}],
  "overloaded_time_blocks": [{"block": string, "ride_count": number, "recommendation": string}],
  "vehicle_activation_needed": boolean,
  "vehicle_recommendation": string,
  "rebalancing_actions": [{"action": string, "impact": string, "priority": "urgent"|"recommended"|"optional"}],
  "balance_score": number,
  "summary": string
}`,

    noshow_risk: `You are a client services analyst for a nonprofit transportation platform.

Client ride history:
${JSON.stringify(data.clientHistory, null, 2)}

Analyze no-show risk and return JSON:
{
  "high_risk_clients": [{"name": string, "no_show_count": number, "risk_level": "critical"|"high"|"medium", "risk_factors": [string], "recommended_action": string}],
  "needs_confirmation_reminder": [{"name": string, "reason": string}],
  "needs_schedule_review": [{"name": string, "reason": string}],
  "needs_case_manager_followup": [{"name": string, "reason": string, "urgency": string}],
  "patterns": [string],
  "summary": string
}`,

    driver_performance: `You are a driver performance analyst for a nonprofit transportation organization.

Driver performance data:
${JSON.stringify(data.driverStats, null, 2)}

Analyze driver performance and return JSON:
{
  "strong_performers": [{"driver": string, "strengths": [string]}],
  "needs_coaching": [{"driver": string, "issues": [string], "coaching_focus": string}],
  "on_time_concerns": [{"driver": string, "on_time_rate": number, "context": string}],
  "cancellation_concerns": [{"driver": string, "cancellation_count": number, "pattern": string}],
  "late_closures": [{"driver": string, "detail": string}],
  "route_inefficiencies": [{"driver": string, "detail": string}],
  "summary": string
}`,

    schedule_quality: `You are a scheduling analyst for a nonprofit transportation service.

Daily schedule data:
${JSON.stringify(data.schedule, null, 2)}

Analyze schedule quality and return JSON:
{
  "sequencing_issues": [{"detail": string, "impact": string, "fix": string}],
  "unrealistic_timings": [{"detail": string, "rides_affected": string, "fix": string}],
  "overloaded_blocks": [{"time_block": string, "ride_count": number, "available_drivers": number, "risk": string}],
  "trip_combination_opportunities": [{"rides": [string], "rationale": string, "time_savings": string}],
  "deadhead_gaps": [{"detail": string, "estimated_waste": string}],
  "conflicts": [{"detail": string, "severity": string}],
  "overall_quality_score": number,
  "summary": string
}`,

    ops_summary: `You are an operations director reviewing transportation data for a nonprofit.

Operations data:
${JSON.stringify(data.opsData, null, 2)}

Generate an executive operations summary and return JSON:
{
  "daily_summary": {"completed": number, "missed": number, "no_show": number, "cancelled": number, "narrative": string},
  "missed_ride_patterns": [string],
  "busiest_periods": [{"period": string, "volume": number, "notes": string}],
  "demand_trends": [string],
  "driver_stress_points": [string],
  "vehicle_stress_points": [string],
  "top_risks_tomorrow": [string],
  "top_risks_next_week": [string],
  "recommended_prep_actions": [{"action": string, "owner": string, "urgency": string}],
  "week_outlook": string
}`,

    data_cleanup: `You are a data quality analyst for a nonprofit transportation platform.

Client records:
${JSON.stringify(data.clientRecords, null, 2)}

Recent ride requests:
${JSON.stringify(data.recentRides, null, 2)}

Analyze data quality and return JSON:
{
  "possible_duplicate_clients": [{"names": [string], "reason": string, "action": string}],
  "possible_duplicate_rides": [{"detail": string, "reason": string}],
  "incomplete_client_records": [{"name": string, "missing_fields": [string], "priority": string}],
  "inconsistent_notes": [{"entity": string, "issue": string}],
  "records_needing_review": [{"entity": string, "name": string, "reason": string}],
  "data_quality_score": number,
  "top_cleanup_actions": [string],
  "summary": string
}`,

    demand_scaling: `You are a transportation operations capacity planner for a nonprofit organization.

Current fleet and staffing snapshot:
${JSON.stringify(data.currentState, null, 2)}

Historical ride distribution patterns:
${JSON.stringify(data.patterns, null, 2)}

Simulate scaling demand from 10 rides/day to 80 rides/day in steps (10, 20, 30, 40, 50, 60, 70, 80).
At each step analyze: driver load, vehicle utilization, scheduling conflicts, and assignment bottlenecks.
Then provide staffing and fleet recommendations.

Return JSON exactly matching this schema:
{
  "simulation_steps": [
    {
      "rides_per_day": number,
      "driver_load": {
        "rides_per_driver": number,
        "utilization_pct": number,
        "overloaded": boolean,
        "status": "green"|"yellow"|"red",
        "notes": string
      },
      "vehicle_utilization": {
        "vehicles_needed": number,
        "vehicles_available": number,
        "utilization_pct": number,
        "status": "green"|"yellow"|"red",
        "notes": string
      },
      "scheduling_conflicts": {
        "conflict_count": number,
        "conflict_type": string,
        "risk_level": "low"|"medium"|"high"|"critical",
        "notes": string
      },
      "assignment_bottleneck": {
        "bottleneck": string,
        "severity": "none"|"minor"|"moderate"|"severe",
        "notes": string
      },
      "overall_readiness": "operational"|"stressed"|"at_risk"|"overwhelmed"
    }
  ],
  "breaking_point": {
    "rides_per_day": number,
    "reason": string,
    "first_failure_mode": string
  },
  "recommendations": {
    "ideal_driver_count": number,
    "ideal_vehicle_count": number,
    "driver_reasoning": string,
    "vehicle_reasoning": string,
    "optimal_distribution_strategy": string,
    "peak_time_staffing": string,
    "trip_batching_potential": string,
    "backup_driver_recommendation": string
  },
  "cost_efficiency": {
    "cost_per_ride_at_10": string,
    "cost_per_ride_at_80": string,
    "economies_of_scale_notes": string
  },
  "risk_summary": [string],
  "summary": string
}`,

    ops_query: `You are an operational intelligence assistant for a nonprofit transportation platform with live data access.

Current system data:
${JSON.stringify(data.systemData, null, 2)}

User question: "${data.question}"

Answer the question using ONLY the provided data. Be specific, cite actual names/numbers, and give actionable answers. Return JSON:
{
  "direct_answer": string,
  "supporting_data": [string],
  "action_items": [string],
  "related_concerns": [string]
}`
  };

  const prompt = prompts[mode];
  if (!prompt) return Response.json({ error: 'Unknown mode: ' + mode }, { status: 400 });

  const result = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: { type: 'object' } });
  return Response.json(result);
});
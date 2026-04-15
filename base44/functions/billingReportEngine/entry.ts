import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { start_date, end_date } = await req.json();

    // Get all completed jobs in date range
    const jobs = await base44.entities.TransportRequest.filter({
      request_date: { $gte: start_date, $lte: end_date },
      status: 'completed'
    });

    // Separate by client type
    const nonprofitJobs = jobs.filter(j => j.client_type === 'nonprofit_hoh');
    const revenueJobs = jobs.filter(j => ['external_contract', 'external_delivery', 'external_medical'].includes(j.client_type));

    // Calculate metrics
    const nonprofitMetrics = calculateMetrics(nonprofitJobs, 'nonprofit_hoh');
    const revenueMetrics = calculateMetrics(revenueJobs, 'revenue');

    // By client type breakdown
    const byClientType = {};
    jobs.forEach(job => {
      if (!byClientType[job.client_type]) {
        byClientType[job.client_type] = {
          client_type: job.client_type,
          job_count: 0,
          total_value: 0,
          total_cost: 0,
          total_margin: 0,
          billable_count: 0
        };
      }
      byClientType[job.client_type].job_count += 1;
      byClientType[job.client_type].total_value += job.job_value || 0;
      byClientType[job.client_type].total_cost += job.cost_estimate || 0;
      byClientType[job.client_type].total_margin += (job.margin || 0);
      if (job.is_billable) byClientType[job.client_type].billable_count += 1;
    });

    // By billing status
    const byBillingStatus = {};
    revenueJobs.forEach(job => {
      const status = job.billing_status || 'draft';
      if (!byBillingStatus[status]) {
        byBillingStatus[status] = { status, count: 0, total_value: 0 };
      }
      byBillingStatus[status].count += 1;
      byBillingStatus[status].total_value += job.job_value || 0;
    });

    return Response.json({
      status: 'success',
      period: { start_date, end_date },
      summary: {
        total_jobs: jobs.length,
        nonprofit_jobs: nonprofitJobs.length,
        revenue_jobs: revenueJobs.length,
        total_revenue: revenueJobs.reduce((sum, j) => sum + (j.job_value || 0), 0),
        total_profit: revenueJobs.reduce((sum, j) => sum + (j.margin || 0), 0),
        total_nonprofit_cost: nonprofitJobs.reduce((sum, j) => sum + (j.cost_estimate || 0), 0)
      },
      nonprofit: nonprofitMetrics,
      revenue: revenueMetrics,
      by_client_type: Object.values(byClientType),
      by_billing_status: Object.values(byBillingStatus),
      by_business_entity: calculateByBusinessEntity(jobs)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateMetrics(jobs, type) {
  const billable = jobs.filter(j => j.is_billable);
  const invoiced = jobs.filter(j => j.billing_status === 'invoiced');
  const paid = jobs.filter(j => j.billing_status === 'paid');

  return {
    total_count: jobs.length,
    billable_count: billable.length,
    invoiced_count: invoiced.length,
    paid_count: paid.length,
    pending_count: billable.length - invoiced.length,
    total_value: jobs.reduce((sum, j) => sum + (j.job_value || 0), 0),
    invoiced_value: invoiced.reduce((sum, j) => sum + (j.job_value || 0), 0),
    paid_value: paid.reduce((sum, j) => sum + (j.job_value || 0), 0),
    total_cost: jobs.reduce((sum, j) => sum + (j.cost_estimate || 0), 0),
    total_margin: jobs.reduce((sum, j) => sum + (j.margin || 0), 0),
    average_job_value: jobs.length > 0 ? jobs.reduce((sum, j) => sum + (j.job_value || 0), 0) / jobs.length : 0
  };
}

function calculateByBusinessEntity(jobs) {
  const entities = {};
  jobs.forEach(job => {
    const entity = job.business_entity || 'mrt_subsidiary';
    if (!entities[entity]) {
      entities[entity] = { entity, job_count: 0, total_value: 0, total_margin: 0 };
    }
    entities[entity].job_count += 1;
    entities[entity].total_value += job.job_value || 0;
    entities[entity].total_margin += job.margin || 0;
  });
  return Object.values(entities);
}
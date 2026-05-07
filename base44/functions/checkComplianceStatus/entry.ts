import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin only' }, { status: 403 });
    }

    const complianceTrackers = await base44.asServiceRole.entities.ComplianceTracker.list();
    const today = new Date();

    // Check for overdue items
    const overdue = complianceTrackers.filter(c => {
      const dueDate = new Date(c.due_date);
      return dueDate < today && c.status === 'pending';
    });

    // Check for items due soon (within 14 days)
    const dueSoon = complianceTrackers.filter(c => {
      const dueDate = new Date(c.due_date);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilDue > 0 && daysUntilDue <= 14 && c.status === 'pending';
    });

    // Compliance by category
    const categories = ['hipaa', 'irs_501c3', 'texas_law', 'usdot', 'ada', 'workers_comp', 'maintenance'];
    const complianceByCategory = {};
    
    for (const category of categories) {
      const items = complianceTrackers.filter(c => c.compliance_category === category);
      const compliant = items.filter(c => c.status === 'compliant').length;
      complianceByCategory[category] = {
        total: items.length,
        compliant,
        pending: items.filter(c => c.status === 'pending').length,
        overdue: items.filter(c => c.status === 'overdue').length,
        rate: items.length > 0 ? Math.round((compliant / items.length) * 100) : 0
      };
    }

    return Response.json({
      success: true,
      overdue: overdue.length,
      overdueItems: overdue.map(o => ({
        id: o.id,
        entity_name: o.entity_name,
        requirement: o.requirement,
        daysOverdue: Math.ceil((today - new Date(o.due_date)) / (1000 * 60 * 60 * 24))
      })),
      dueSoon: dueSoon.length,
      dueSoonItems: dueSoon.map(d => ({
        id: d.id,
        entity_name: d.entity_name,
        requirement: d.requirement,
        daysUntilDue: Math.ceil((new Date(d.due_date) - today) / (1000 * 60 * 60 * 24))
      })),
      complianceByCategory,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Compliance check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
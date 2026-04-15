import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Ensures diamondboyig@gmail.com is set as super_admin
 * Called on app startup or manually to ensure admin access
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get the user to ensure they're authenticated
    const currentUser = await base44.auth.me();
    if (!currentUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow super_admin or admin to run this
    if (!['super_admin', 'admin'].includes(currentUser.role)) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Find the target user (diamondboyig@gmail.com)
    const targetEmail = 'diamondboyig@gmail.com';
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);
    const targetUser = allUsers.find(u => u.email === targetEmail);

    if (!targetUser) {
      return Response.json({ 
        error: 'User not found',
        message: `${targetEmail} has not logged in yet. They must log in first to be assigned the super_admin role.`,
        email: targetEmail
      }, { status: 404 });
    }

    // Update the user to super_admin if not already
    if (targetUser.role !== 'super_admin') {
      await base44.asServiceRole.entities.User.update(targetUser.id, {
        role: 'super_admin',
        is_active: true
      });

      return Response.json({
        success: true,
        message: `${targetEmail} has been promoted to super_admin`,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          full_name: targetUser.full_name,
          role: 'super_admin'
        }
      });
    }

    return Response.json({
      success: true,
      message: `${targetEmail} is already configured as super_admin`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        full_name: targetUser.full_name,
        role: 'super_admin'
      }
    });

  } catch (error) {
    console.error('Error ensuring super admin:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
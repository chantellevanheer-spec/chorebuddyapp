import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get all recurring chores
    const chores = await base44.asServiceRole.entities.Chore.filter({ is_recurring: true });
    
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const todayDayOfWeek = today.getDay(); // 0 = Sunday
    const todayDayOfMonth = today.getDate();
    
    let assignmentsCreated = 0;
    const results = [];

    for (const chore of chores) {
      // Check if we should create assignment today based on recurrence pattern
      let shouldAssign = false;
      const lastAssigned = chore.last_auto_assigned_date;
      
      if (!lastAssigned || lastAssigned !== todayString) {
        switch (chore.recurrence_pattern) {
          case 'daily':
            shouldAssign = true;
            break;
            
          case 'weekly_same_day':
            if (chore.recurrence_day !== undefined && todayDayOfWeek === chore.recurrence_day) {
              shouldAssign = true;
            }
            break;
            
          case 'every_2_weeks':
            if (chore.recurrence_day !== undefined && todayDayOfWeek === chore.recurrence_day) {
              // Check if it's been 14 days since last assignment
              if (lastAssigned) {
                const lastDate = new Date(lastAssigned);
                const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
                if (daysDiff >= 14) shouldAssign = true;
              } else {
                shouldAssign = true;
              }
            }
            break;
            
          case 'monthly_same_date':
            if (chore.recurrence_date !== undefined && todayDayOfMonth === chore.recurrence_date) {
              shouldAssign = true;
            }
            break;
            
          case 'custom':
            if (chore.custom_recurrence_days && chore.custom_recurrence_days.includes(todayDayOfWeek)) {
              shouldAssign = true;
            }
            break;
        }
      }

      if (shouldAssign) {
        // Determine who to assign to
        let assignToPersonId = null;
        
        if (chore.manual_rotation_enabled && chore.rotation_person_order?.length > 0) {
          // Use manual rotation
          const currentIndex = chore.rotation_current_index || 0;
          assignToPersonId = chore.rotation_person_order[currentIndex];
          
          // Update rotation index for next time
          const nextIndex = (currentIndex + 1) % chore.rotation_person_order.length;
          await base44.asServiceRole.entities.Chore.update(chore.id, {
            rotation_current_index: nextIndex,
            rotation_last_assigned_date: todayString,
            last_auto_assigned_date: todayString
          });
        } else if (chore.auto_assign) {
          // Let ChoreAI handle it later - just mark as needs assignment
          await base44.asServiceRole.entities.Chore.update(chore.id, {
            last_auto_assigned_date: todayString
          });
          
          results.push({
            chore_id: chore.id,
            chore_title: chore.title,
            action: 'marked_for_choreai',
            message: 'Will be assigned by ChoreAI'
          });
          continue;
        }

        if (assignToPersonId) {
          // Create the assignment
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
          const weekStartString = weekStart.toISOString().split('T')[0];
          
          // Calculate due date based on frequency
          const dueDate = new Date(today);
          switch (chore.frequency) {
            case 'daily':
              dueDate.setDate(today.getDate() + 1);
              break;
            case 'weekly':
              dueDate.setDate(today.getDate() + 7);
              break;
            case 'monthly':
              dueDate.setMonth(today.getMonth() + 1);
              break;
            default:
              dueDate.setDate(today.getDate() + 7);
          }
          
          await base44.asServiceRole.entities.Assignment.create({
            chore_id: chore.id,
            person_id: assignToPersonId,
            week_start: weekStartString,
            due_date: dueDate.toISOString().split('T')[0],
            family_id: chore.family_id,
            completed: false
          });
          
          assignmentsCreated++;
          results.push({
            chore_id: chore.id,
            chore_title: chore.title,
            assigned_to: assignToPersonId,
            action: 'assigned'
          });
        }
      }
    }

    return Response.json({
      success: true,
      processed_chores: chores.length,
      assignments_created: assignmentsCreated,
      results
    });
  } catch (error) {
    console.error('Error processing recurring chores:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
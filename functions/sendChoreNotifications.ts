import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { startOfWeek, endOfWeek, format, addDays } from 'npm:date-fns';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin' && user?.family_role !== 'parent') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { notificationType = 'daily_reminders' } = await req.json();

    // Get all family users
    const allUsers = await base44.asServiceRole.entities.User.list();
    const familyUsers = allUsers.filter(u => 
      u.family_id === user.family_id && 
      u.receives_chore_reminders
    );

    if (familyUsers.length === 0) {
      return Response.json({ 
        success: true, 
        message: 'No users with notifications enabled',
        sentCount: 0 
      });
    }

    // Get current week's assignments
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    
    const assignments = await base44.asServiceRole.entities.Assignment.filter({
      week_start: weekStartStr,
      completed: false,
      family_id: user.family_id
    });

    const people = await base44.asServiceRole.entities.Person.list();
    const chores = await base44.asServiceRole.entities.Chore.list();

    let emailsSent = 0;

    // Send notifications to each user
    for (const recipient of familyUsers) {
      // Find their linked person
      const linkedPerson = people.find(p => p.linked_user_id === recipient.id);
      
      if (!linkedPerson) continue;

      // Get their pending assignments
      const userAssignments = assignments.filter(a => a.person_id === linkedPerson.id);
      
      if (userAssignments.length === 0) continue;

      // Build email content
      const assignmentsList = userAssignments.map(assignment => {
        const chore = chores.find(c => c.id === assignment.chore_id);
        const dueDate = assignment.due_date ? format(new Date(assignment.due_date), 'MMM d') : 'This week';
        return `
          <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 12px; border-left: 4px solid #5E3B85;">
            <h3 style="margin: 0 0 5px 0; color: #2B59C3; font-size: 18px;">${chore?.title || 'Chore'}</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">Due: ${dueDate}</p>
            ${chore?.description ? `<p style="margin: 5px 0; color: #666; font-size: 14px;">${chore.description}</p>` : ''}
          </div>
        `;
      }).join('');

      const emailBody = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #FDFBF5; padding: 30px; border-radius: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2B59C3; font-size: 32px; margin: 0;">🏠 ChoreBuddy</h1>
            <p style="color: #5E3B85; font-size: 16px; margin: 10px 0 0 0;">Your Chore Reminders</p>
          </div>
          
          <div style="background: white; padding: 25px; border-radius: 16px; border: 3px solid #5E3B85; box-shadow: 4px 4px 0px #5E3B85;">
            <h2 style="color: #5E3B85; margin-top: 0;">Hi ${linkedPerson.name}! 👋</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              You have <strong>${userAssignments.length}</strong> chore${userAssignments.length > 1 ? 's' : ''} to complete this week:
            </p>
            
            ${assignmentsList}
            
            <div style="text-align: center; margin-top: 25px;">
              <a href="https://www.chorebuddyapp.com" style="display: inline-block; background: #2B59C3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; border: 3px solid #5E3B85; box-shadow: 3px 3px 0px #5E3B85;">
                View My Chores
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>You're receiving this because you enabled chore reminders in your ChoreBuddy settings.</p>
          </div>
        </div>
      `;

      try {
        await base44.asServiceRole.functions.invoke('sendGmailNotification', {
          to: recipient.email,
          subject: `🏠 ChoreBuddy: ${userAssignments.length} Chore${userAssignments.length > 1 ? 's' : ''} This Week`,
          body: emailBody,
          notificationType: 'chore_reminder'
        });
        emailsSent++;
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
      }
    }

    return Response.json({
      success: true,
      message: `Sent ${emailsSent} chore reminder emails`,
      sentCount: emailsSent
    });

  } catch (error) {
    console.error('Error sending chore notifications:', error);
    return Response.json({ 
      error: error.message || 'Failed to send notifications' 
    }, { status: 500 });
  }
});
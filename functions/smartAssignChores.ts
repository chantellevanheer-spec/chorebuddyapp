import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';
import { format, startOfWeek, addDays } from 'npm:date-fns@2.30.0';

// A more robust and less error-prone assignment algorithm.
const simpleAdvancedAssignment = (chores, people, existingAssignments = []) => {
    if (!people || people.length === 0 || !chores || chores.length === 0) {
        return [];
    }

    const currentWeekStart = format(startOfWeek(new Date()), "yyyy-MM-dd");
    const choresToAssign = chores.filter(c => c.auto_assign !== false);
    
    // Create a map of chores already assigned this week for quick lookup
    const assignedChoreIds = new Set(
        existingAssignments
            .filter(a => a.week_start === currentWeekStart)
            .map(a => a.chore_id)
    );

    // Filter out chores that are already assigned
    const unassignedChores = choresToAssign.filter(c => !assignedChoreIds.has(c.id));
    
    // Sort chores by priority (higher first)
    unassignedChores.sort((a, b) => (b.priority_weight || 5) - (a.priority_weight || 5));

    // Initialize workload for this week
    const weeklyWorkload = {};
    people.forEach(p => {
        weeklyWorkload[p.id] = existingAssignments.filter(a => a.person_id === p.id && a.week_start === currentWeekStart).length;
    });

    const newAssignments = [];

    for (const chore of unassignedChores) {
        // Find the best person for this chore
        let bestPerson = null;
        let lowestWorkload = Infinity;

        // Sort people by current workload to find the least busy person
        const sortedPeople = [...people].sort((a, b) => (weeklyWorkload[a.id] || 0) - (weeklyWorkload[b.id] || 0));

        for (const person of sortedPeople) {
            const workload = weeklyWorkload[person.id] || 0;
            const maxChores = person.max_weekly_chores || 7; // Default to 7 if not set

            // Check if person is under their max chore limit
            if (workload < maxChores) {
                bestPerson = person;
                break; // Found the least busy person available
            }
        }

        if (bestPerson) {
            newAssignments.push({
                person_id: bestPerson.id,
                chore_id: chore.id,
                week_start: currentWeekStart,
                due_date: format(addDays(startOfWeek(new Date()), 6), "yyyy-MM-dd"),
                completed: false,
                family_id: chore.family_id,
            });
            // Increment workload for the assigned person
            weeklyWorkload[bestPerson.id]++;
        }
    }
    
    return newAssignments;
};


Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    try {
        let user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized. You must be logged in.' }), { 
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!user.family_id) {
            user = await base44.asServiceRole.entities.User.get(user.id);
        }
        
        if (!user || !user.family_id) {
            return new Response(JSON.stringify({ error: 'You must be part of a family to use ChoreAI.' }), { 
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }

        if (user.subscription_tier === 'free') {
            return new Response(JSON.stringify({ error: 'ChoreAI assignment requires a Basic or Premium plan.' }), { 
                status: 403, headers: { 'Content-Type': 'application/json' }
            });
        }

        const [people, chores, existingAssignments] = await Promise.all([
            base44.asServiceRole.entities.Person.filter({ family_id: user.family_id }),
            base44.asServiceRole.entities.Chore.filter({ family_id: user.family_id }),
            base44.asServiceRole.entities.Assignment.filter({ family_id: user.family_id })
        ]);

        if (people.length === 0) {
            return new Response(JSON.stringify({ error: 'No family members found. Add family members first.' }), { 
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }
        if (chores.length === 0) {
            return new Response(JSON.stringify({ error: 'No chores found. Add some chores first.' }), { 
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }

        const newAssignments = simpleAdvancedAssignment(chores, people, existingAssignments);

        if (newAssignments.length > 0) {
            await base44.asServiceRole.entities.Assignment.bulkCreate(newAssignments);
        }

        return new Response(JSON.stringify({ success: true, created: newAssignments.length }), { status: 200, headers: { 'Content-Type': 'application/json' }});

    } catch (error) {
        console.error('CRITICAL ERROR in smartAssignChores:', error.message, error.stack);
        return new Response(JSON.stringify({ error: "An internal server error occurred while assigning chores." }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
});
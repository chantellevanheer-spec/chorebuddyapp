import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { format, startOfWeek, addDays, addWeeks, parseISO, differenceInWeeks } from 'npm:date-fns@3.6.0';

// Handle manual rotation for a chore
const getNextRotationPerson = (chore, currentWeekStart) => {
    if (!chore.manual_rotation_enabled || !chore.rotation_person_order || chore.rotation_person_order.length === 0) {
        return null;
    }

    let currentIndex = chore.rotation_current_index || 0;
    const rotationOrder = chore.rotation_person_order;

    // Check if we need to advance the rotation
    if (chore.rotation_last_assigned_date) {
        const lastAssignedDate = parseISO(chore.rotation_last_assigned_date);
        const currentDate = parseISO(currentWeekStart);
        const weeksDiff = differenceInWeeks(currentDate, lastAssignedDate);

        let shouldAdvance = false;
        if (chore.rotation_frequency === 'weekly' && weeksDiff >= 1) {
            shouldAdvance = true;
        } else if (chore.rotation_frequency === 'bi_weekly' && weeksDiff >= 2) {
            shouldAdvance = true;
        } else if (chore.rotation_frequency === 'monthly' && weeksDiff >= 4) {
            shouldAdvance = true;
        }

        if (shouldAdvance) {
            currentIndex = (currentIndex + 1) % rotationOrder.length;
        }
    }

    return {
        personId: rotationOrder[currentIndex],
        newIndex: currentIndex
    };
};

// A more robust and less error-prone assignment algorithm.
const simpleAdvancedAssignment = (chores, people, existingAssignments = [], choreUpdates = []) => {
    if (!people || people.length === 0 || !chores || chores.length === 0) {
        return { assignments: [], choreUpdates: [] };
    }

    const currentWeekStart = format(startOfWeek(new Date()), "yyyy-MM-dd");
    
    // Separate chores into rotation and auto-assign
    const rotationChores = chores.filter(c => c.manual_rotation_enabled);
    const autoAssignChores = chores.filter(c => c.auto_assign !== false && !c.manual_rotation_enabled);
    
    // Create a map of chores already assigned this week for quick lookup
    const assignedChoreIds = new Set(
        existingAssignments
            .filter(a => a.week_start === currentWeekStart)
            .map(a => a.chore_id)
    );

    // Filter out chores that are already assigned
    const unassignedRotationChores = rotationChores.filter(c => !assignedChoreIds.has(c.id));
    const unassignedAutoChores = autoAssignChores.filter(c => !assignedChoreIds.has(c.id));
    
    // Initialize workload for this week
    const weeklyWorkload = {};
    people.forEach(p => {
        weeklyWorkload[p.id] = existingAssignments.filter(a => a.person_id === p.id && a.week_start === currentWeekStart).length;
    });

    const newAssignments = [];
    const choreUpdatesToReturn = [];

    // First, handle rotation chores
    for (const chore of unassignedRotationChores) {
        const rotationResult = getNextRotationPerson(chore, currentWeekStart);
        
        if (rotationResult && rotationResult.personId) {
            // Verify the person still exists
            const person = people.find(p => p.id === rotationResult.personId);
            if (person) {
                newAssignments.push({
                    person_id: rotationResult.personId,
                    chore_id: chore.id,
                    week_start: currentWeekStart,
                    due_date: format(addDays(startOfWeek(new Date()), 6), "yyyy-MM-dd"),
                    completed: false,
                    family_id: chore.family_id,
                });
                
                // Track chore update
                choreUpdatesToReturn.push({
                    id: chore.id,
                    rotation_current_index: rotationResult.newIndex,
                    rotation_last_assigned_date: currentWeekStart
                });

                // Increment workload
                weeklyWorkload[rotationResult.personId]++;
            }
        }
    }

    // Sort auto-assign chores by priority (higher first)
    unassignedAutoChores.sort((a, b) => (b.priority_weight || 5) - (a.priority_weight || 5));

    // Then handle auto-assign chores
    for (const chore of unassignedAutoChores) {
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
    
    return { assignments: newAssignments, choreUpdates: choreUpdatesToReturn };
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

        const { assignments: newAssignments, choreUpdates } = simpleAdvancedAssignment(chores, people, existingAssignments);

        if (newAssignments.length > 0) {
            await base44.asServiceRole.entities.Assignment.bulkCreate(newAssignments);
        }

        // Update rotation chores with new indices
        if (choreUpdates.length > 0) {
            await Promise.all(
                choreUpdates.map(update => 
                    base44.asServiceRole.entities.Chore.update(update.id, {
                        rotation_current_index: update.rotation_current_index,
                        rotation_last_assigned_date: update.rotation_last_assigned_date
                    })
                )
            );
        }

        return new Response(JSON.stringify({ 
            success: true, 
            created: newAssignments.length,
            rotations_updated: choreUpdates.length 
        }), { status: 200, headers: { 'Content-Type': 'application/json' }});

    } catch (error) {
        console.error('CRITICAL ERROR in smartAssignChores:', error.message, error.stack);
        return new Response(JSON.stringify({ error: "An internal server error occurred while assigning chores." }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
});
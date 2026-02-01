import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only parents can use AI advisor
        if (user.data?.family_role !== 'parent' && user.family_role !== 'parent') {
            return Response.json({ error: 'Forbidden: Only parents can use AI suggestions' }, { status: 403 });
        }

        if (!user.family_id) {
            return Response.json({ error: 'No family found' }, { status: 400 });
        }

        const { suggestionType } = await req.json();

        // Fetch family data
        const [people, chores, assignments, rewards] = await Promise.all([
            base44.entities.Person.list(),
            base44.entities.Chore.list(),
            base44.entities.Assignment.list(),
            base44.entities.Reward.list()
        ]);

        // Calculate completion rates
        const completedAssignments = assignments.filter(a => a.completed);
        const completionRate = assignments.length > 0 
            ? Math.round((completedAssignments.length / assignments.length) * 100) 
            : 0;

        // Analyze family composition
        const adults = people.filter(p => p.role === 'adult').length;
        const teens = people.filter(p => p.role === 'teen').length;
        const children = people.filter(p => p.role === 'child').length;
        const totalMembers = people.length;

        // Get chore categories currently in use
        const choreCategories = [...new Set(chores.map(c => c.category))];
        
        // Analyze person-specific completion rates
        const personStats = people.map(person => {
            const personAssignments = assignments.filter(a => a.person_id === person.id);
            const personCompleted = personAssignments.filter(a => a.completed).length;
            const personRate = personAssignments.length > 0 
                ? Math.round((personCompleted / personAssignments.length) * 100) 
                : 0;
            return {
                name: person.name,
                role: person.role,
                completionRate: personRate,
                totalAssignments: personAssignments.length
            };
        });

        let prompt = '';
        let responseSchema = {};

        if (suggestionType === 'chores') {
            prompt = `You are a household management expert. Analyze this family's data and suggest 5 new chore ideas that would be beneficial.

Family Composition:
- Adults: ${adults}
- Teens: ${teens}
- Children: ${children}
- Total members: ${totalMembers}

Current chores: ${chores.length} chores across categories: ${choreCategories.join(', ')}
Overall completion rate: ${completionRate}%

Member performance:
${personStats.map(p => `- ${p.name} (${p.role}): ${p.completionRate}% completion rate (${p.totalAssignments} assignments)`).join('\n')}

Based on this data, suggest 5 chores that:
1. Fill gaps in their current chore coverage
2. Are age-appropriate for their family composition
3. Are achievable given their current completion rates
4. Will help maintain a well-functioning household

For each chore, provide: title, description, difficulty (easy/medium/hard), category (kitchen/bathroom/living_room/bedroom/outdoor/other), estimated_time (in minutes), and why it's a good fit for this family.`;

            responseSchema = {
                type: "object",
                properties: {
                    suggestions: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                title: { type: "string" },
                                description: { type: "string" },
                                difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                                category: { type: "string", enum: ["kitchen", "bathroom", "living_room", "bedroom", "outdoor", "other"] },
                                estimated_time: { type: "number" },
                                reasoning: { type: "string" }
                            }
                        }
                    }
                }
            };
        } else if (suggestionType === 'rewards') {
            // Calculate average points per person
            const totalPoints = rewards.reduce((sum, r) => sum + r.points, 0);
            const avgPointsPerPerson = people.length > 0 ? Math.round(totalPoints / people.length) : 0;

            prompt = `You are a family motivation expert. Suggest 5 creative reward ideas for this household's points-based chore system.

Family Composition:
- Adults: ${adults}
- Teens: ${teens}
- Children: ${children}
- Average points per person: ${avgPointsPerPerson}
- Overall chore completion rate: ${completionRate}%

Suggest rewards that:
1. Are motivating for the age groups present (${adults > 0 ? 'adults, ' : ''}${teens > 0 ? 'teens, ' : ''}${children > 0 ? 'children' : ''})
2. Have varied point costs (from affordable to premium rewards)
3. Are practical and achievable for a typical family
4. Encourage continued participation in the chore system

Categories to consider: privileges, treats, activities, or other creative ideas.
For each reward, provide: name, description, cost (in points), category, and an icon name from lucide-react library.`;

            responseSchema = {
                type: "object",
                properties: {
                    suggestions: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                description: { type: "string" },
                                cost: { type: "number" },
                                category: { type: "string", enum: ["privileges", "treats", "activities", "other"] },
                                icon: { type: "string" }
                            }
                        }
                    }
                }
            };
        } else {
            return Response.json({ error: 'Invalid suggestion type' }, { status: 400 });
        }

        // Call AI with the prompt
        const aiResponse = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: responseSchema
        });

        return Response.json({ 
            success: true, 
            suggestions: aiResponse.suggestions,
            familyContext: {
                totalMembers,
                composition: { adults, teens, children },
                completionRate
            }
        });

    } catch (error) {
        console.error("AI Advisor Error:", error);
        return Response.json({ error: error.message || 'Failed to generate suggestions' }, { status: 500 });
    }
});
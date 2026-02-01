import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { checkRateLimit, isParent, getUserFamilyId } from './lib/security.js';

// Constants
const AI_TIMEOUT_MS = 30000;
const SUGGESTION_COUNT = 5;
const MIN_FAMILY_MEMBERS = 1;

const CHORE_DIFFICULTIES = ['easy', 'medium', 'hard'];
const CHORE_CATEGORIES = ['kitchen', 'bathroom', 'living_room', 'bedroom', 'outdoor', 'other'];
const REWARD_CATEGORIES = ['privileges', 'treats', 'activities', 'other'];

const VALID_TIME_RANGE = { min: 5, max: 180 };
const VALID_COST_RANGE = { min: 10, max: 500 };

/**
 * Validate chore suggestion
 */
const validateChoreSuggestion = (chore) => {
    return (
        chore &&
        typeof chore.title === 'string' && chore.title.trim().length > 0 &&
        typeof chore.description === 'string' && chore.description.trim().length > 0 &&
        CHORE_DIFFICULTIES.includes(chore.difficulty) &&
        CHORE_CATEGORIES.includes(chore.category) &&
        typeof chore.estimated_time === 'number' &&
        chore.estimated_time >= VALID_TIME_RANGE.min &&
        chore.estimated_time <= VALID_TIME_RANGE.max
    );
};

/**
 * Validate reward suggestion
 */
const validateRewardSuggestion = (reward) => {
    return (
        reward &&
        typeof reward.name === 'string' && reward.name.trim().length > 0 &&
        typeof reward.description === 'string' && reward.description.trim().length > 0 &&
        typeof reward.cost === 'number' &&
        reward.cost >= VALID_COST_RANGE.min &&
        reward.cost <= VALID_COST_RANGE.max &&
        REWARD_CATEGORIES.includes(reward.category)
    );
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only parents can use AI advisor
        if (!isParent(user)) {
            return Response.json({ error: 'Forbidden: Only parents can use AI suggestions' }, { status: 403 });
        }

        const familyId = getUserFamilyId(user);
        if (!familyId) {
            return Response.json({ error: 'No family found' }, { status: 400 });
        }

        // Rate limiting - max 10 AI requests per 10 minutes
        const rateLimit = checkRateLimit(user.id, 'ai_suggestions', 10, 10 * 60 * 1000);
        if (!rateLimit.allowed) {
            return Response.json({ 
                error: 'Too many AI requests. Please try again later.',
                resetTime: rateLimit.resetTime 
            }, { status: 429 });
        }

        // Parse and validate request
        let requestBody;
        try {
            requestBody = await req.json();
        } catch {
            return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
        }

        const { suggestionType } = requestBody;

        if (!['chores', 'rewards'].includes(suggestionType)) {
            return Response.json({ error: 'Invalid suggestion type. Must be "chores" or "rewards"' }, { status: 400 });
        }

        // Fetch family data in parallel
        const [people, chores, assignments, rewards] = await Promise.all([
            base44.entities.Person.list(),
            base44.entities.Chore.list(),
            base44.entities.Assignment.list(),
            base44.entities.Reward.list()
        ]);

        // Validate minimum data requirements
        if (!people || people.length < MIN_FAMILY_MEMBERS) {
            return Response.json({ error: 'No family members found. Add family members first.' }, { status: 400 });
        }

        if (suggestionType === 'chores' && chores.length === 0) {
            return Response.json({ error: 'Add at least one chore before requesting suggestions' }, { status: 400 });
        }

        // Calculate metrics
        const completedAssignments = assignments.filter(a => a.completed);
        const completionRate = assignments.length > 0 
            ? Math.round((completedAssignments.length / assignments.length) * 100) 
            : 0;

        // Analyze family composition by Person role
        const composition = {
            adults: people.filter(p => p.role === 'adult').length,
            teens: people.filter(p => p.role === 'teen').length,
            children: people.filter(p => p.role === 'child').length,
            totalMembers: people.length
        };

        // Get chore categories
        const choreCategories = [...new Set(chores.map(c => c.category).filter(Boolean))];
        
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
            prompt = `You are a household management expert. Analyze this family's data and suggest ${SUGGESTION_COUNT} new chore ideas that would be beneficial.

Family Composition:
- Adults: ${composition.adults}
- Teens: ${composition.teens}
- Children: ${composition.children}
- Total members: ${composition.totalMembers}

Current chores: ${chores.length} chores across categories: ${choreCategories.length > 0 ? choreCategories.join(', ') : 'none yet'}
Overall completion rate: ${completionRate}%

Member performance:
${personStats.map(p => `- ${p.name} (${p.role}): ${p.completionRate}% completion rate (${p.totalAssignments} assignments)`).join('\n')}

Based on this data, suggest ${SUGGESTION_COUNT} chores that:
1. Fill gaps in their current chore coverage
2. Are age-appropriate for their family composition
3. Are achievable given their current completion rates (avoid overly complex tasks if completion is low)
4. Will help maintain a well-functioning household
5. Vary in difficulty to suit different family members

For each chore, provide: title, description, difficulty (easy/medium/hard), category, estimated_time (5-180 minutes), and reasoning.`;

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
                                difficulty: { type: "string", enum: CHORE_DIFFICULTIES },
                                category: { type: "string", enum: CHORE_CATEGORIES },
                                estimated_time: { type: "number" },
                                reasoning: { type: "string" }
                            },
                            required: ["title", "description", "difficulty", "category", "estimated_time", "reasoning"]
                        },
                        minItems: SUGGESTION_COUNT,
                        maxItems: SUGGESTION_COUNT
                    }
                },
                required: ["suggestions"]
            };
        } else {
            // Rewards
            const totalPoints = rewards.reduce((sum, r) => sum + (r.points || 0), 0);
            const avgPointsPerPerson = people.length > 0 ? Math.round(totalPoints / people.length) : 0;
            
            const ageGroups = [
                composition.adults > 0 ? 'adults' : null,
                composition.teens > 0 ? 'teens' : null,
                composition.children > 0 ? 'children' : null
            ].filter(Boolean).join(', ');

            prompt = `You are a family motivation expert. Suggest ${SUGGESTION_COUNT} creative reward ideas for this household's points-based chore system.

Family Composition:
- Adults: ${composition.adults}
- Teens: ${composition.teens}
- Children: ${composition.children}
- Average points per person: ${avgPointsPerPerson}
- Overall chore completion rate: ${completionRate}%
- Current rewards: ${rewards.length}

Suggest rewards that:
1. Are motivating for the age groups present: ${ageGroups}
2. Have varied point costs (include both affordable daily rewards and premium goal rewards)
3. Are practical and achievable for a typical family
4. Encourage continued participation in the chore system
5. Are family-friendly and positive

Categories: privileges (screen time, staying up late), treats (snacks, desserts), activities (outings, events), or other creative ideas.

For each reward, provide: name, description, cost (10-500 points), category, and reasoning.`;

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
                                category: { type: "string", enum: REWARD_CATEGORIES },
                                reasoning: { type: "string" }
                            },
                            required: ["name", "description", "cost", "category", "reasoning"]
                        },
                        minItems: SUGGESTION_COUNT,
                        maxItems: SUGGESTION_COUNT
                    }
                },
                required: ["suggestions"]
            };
        }

        // Call AI with timeout protection
        const aiResponse = await Promise.race([
            base44.integrations.Core.InvokeLLM({
                prompt,
                response_json_schema: responseSchema
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('AI request timeout')), AI_TIMEOUT_MS)
            )
        ]);

        // Validate AI response structure
        if (!aiResponse || !aiResponse.suggestions || !Array.isArray(aiResponse.suggestions)) {
            throw new Error('Invalid AI response format');
        }

        // Validate and filter suggestions
        const validator = suggestionType === 'chores' ? validateChoreSuggestion : validateRewardSuggestion;
        const validSuggestions = aiResponse.suggestions.filter(validator);

        if (validSuggestions.length === 0) {
            throw new Error('No valid suggestions received from AI');
        }

        // Return successful response
        return Response.json({ 
            success: true, 
            suggestions: validSuggestions,
            metadata: {
                requestedCount: SUGGESTION_COUNT,
                returnedCount: validSuggestions.length,
                suggestionType,
                generatedAt: new Date().toISOString()
            },
            familyContext: {
                totalMembers: composition.totalMembers,
                composition: {
                    adults: composition.adults,
                    teens: composition.teens,
                    children: composition.children
                },
                completionRate,
                existingChores: chores.length,
                existingRewards: rewards.length
            }
        });

    } catch (error) {
        console.error("AI Advisor Error:", error);
        
        // Determine appropriate error status and message
        let status = 500;
        let errorMessage = 'Failed to generate suggestions';
        
        if (error.message?.includes('timeout')) {
            status = 504;
            errorMessage = 'AI request timed out. Please try again.';
        } else if (error.message?.includes('Invalid')) {
            status = 400;
            errorMessage = error.message;
        }
        
        return Response.json({ 
            error: errorMessage,
            success: false,
            timestamp: new Date().toISOString()
        }, { status });
    }
});
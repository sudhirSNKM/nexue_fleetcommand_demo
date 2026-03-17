'use server';
/**
 * @fileOverview NexAI Route Strategist AI Agent.
 *
 * - analyzeRoute - A function that provides tactical insights for a specific ride route.
 * - AnalyzeRouteInput - The input type for the analysis.
 * - AnalyzeRouteOutput - The return type for the analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeRouteInputSchema = z.object({
  pickup: z.string().describe('The pickup location address.'),
  dropoff: z.string().describe('The destination location address.'),
  vehicleType: z.string().describe('The type of vehicle (Bike, Auto, Cab).'),
});
export type AnalyzeRouteInput = z.infer<typeof AnalyzeRouteInputSchema>;

const AnalyzeRouteOutputSchema = z.object({
  strategy: z.string().describe('A tactical summary of the route strategy.'),
  safetyAdvisory: z.string().describe('Safety tips or weather-related advisories for this route.'),
  efficiencyScore: z.number().describe('A score from 1-100 representing the route efficiency.'),
  suggestedAction: z.string().describe('A specific action recommended to the user.'),
});
export type AnalyzeRouteOutput = z.infer<typeof AnalyzeRouteOutputSchema>;

export async function analyzeRoute(input: AnalyzeRouteInput): Promise<AnalyzeRouteOutput> {
  return routeStrategistFlow(input);
}

const prompt = ai.definePrompt({
  name: 'routeStrategistPrompt',
  input: { schema: AnalyzeRouteInputSchema },
  output: { schema: AnalyzeRouteOutputSchema },
  prompt: `You are the NexAI Tactical Strategist for Rapido OS. 
Analyze the following ride route and provide a high-tech, tactical briefing.

Route Details:
Origin: {{{pickup}}}
Target: {{{dropoff}}}
Unit Class: {{{vehicleType}}}

Provide a briefing that includes:
1. A tactical strategy (e.g., "High-traffic sector detected, recommend secondary bypass").
2. A safety advisory (e.g., "Monsoon conditions active, ensure unit has wet-grip tires").
3. An efficiency score (1-100).
4. A suggested action for the passenger or operator.

Keep the tone professional, technical, and futuristic (Command Center style).`,
});

const routeStrategistFlow = ai.defineFlow(
  {
    name: 'routeStrategistFlow',
    inputSchema: AnalyzeRouteInputSchema,
    outputSchema: AnalyzeRouteOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('Failed to generate tactical briefing');
    return output;
  }
);

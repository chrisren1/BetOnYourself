"use server";

import Anthropic from "@anthropic-ai/sdk";
import { BetCategory } from "@/lib/types";

const CATEGORIES: BetCategory[] = ["fitness", "sleep", "food", "work", "social", "other"];

const CATEGORY_HINTS = `- fitness: exercise, workouts, gym, sports, physical training
- sleep: sleep schedule, bedtime, waking up early
- food: cooking, diet, nutrition, meal prep
- work: productivity, focused work sessions, coding, business, side projects
- social: drinking, going out, relationships, games/hobbies with other people
- other: anything that doesn't clearly fit the above`;

// Suggests a category for a bet title using Claude. Returns null on any
// failure (no API key configured, refusal, network error) so callers can
// silently fall back to the user's manual category picker.
export async function suggestCategory(title: string): Promise<BetCategory | null> {
  const trimmed = title.trim();
  if (!process.env.ANTHROPIC_API_KEY || trimmed.length < 3) return null;

  try {
    const client = new Anthropic();

    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 100,
      thinking: { type: "disabled" },
      output_config: {
        effort: "low",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              category: { type: "string", enum: CATEGORIES },
            },
            required: ["category"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "user",
          content: `Classify this self-accountability bet's title into exactly one category.\n\nCategories:\n${CATEGORY_HINTS}\n\nTitle: "${trimmed}"`,
        },
      ],
    });

    if (response.stop_reason === "refusal") return null;

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return null;

    const parsed = JSON.parse(block.text) as { category: string };
    return (CATEGORIES as string[]).includes(parsed.category)
      ? (parsed.category as BetCategory)
      : null;
  } catch {
    return null;
  }
}

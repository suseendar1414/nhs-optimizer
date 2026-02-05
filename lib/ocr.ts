import { anthropic } from './anthropic';

// Updated prompt with user rules
const CLAUDE_PROMPT = `You are an expert NHS bank shift parser. Your goal is to transform messy healthcare staffing screenshots into a structured JSON array of individual shifts.

CRITICAL RULES:
1. ONLY return a valid JSON array. No conversational text, no markdown blocks.
2. EXPAND BLOCKS: If a screenshot shows a range (e.g., "Mon 12 Dec - Thu 15 Dec, 4 shifts"), create 4 separate JSON objects, one for each day.
3. STATUS DETECTION: Add a "status" field. 
   - If the image says "APPLIED", status is "booked". 
   - Otherwise, status is "available".
4. DATE HANDLING: All dates must be ISO format (YYYY-MM-DD). Assume the year is 2026 unless specified.
5. DEFAULTS: If a rate is missing, use "unknown". If a time is missing for a night shift, assume 19:00-07:00.

MAPPING HINTS:
- "ST2", "Registrar", "Band 5" -> Put in "ward" or a "role" metadata field if you have one, otherwise keep in "ward".
- "Emergency Medicine" -> Ward.
- "£28/hr" -> rate: 28.

Required JSON Structure:
[
  {
    "date": "2026-12-12",
    "hospital": "St Thomas Hospital",
    "ward": "Emergency Medicine (Registrar)",
    "start": "09:00",
    "end": "17:00",
    "rate": "unknown",
    "status": "available"
  }
]

EXAMPLE INPUT: "Job 12871: Mon 12/12 - Thu 15/12, 09:00-17:00, 4 shifts"
EXAMPLE OUTPUT: 
[
  {"date": "2026-12-12", "hospital": "unknown", ...},
  {"date": "2026-12-13", "hospital": "unknown", ...},
  {"date": "2026-12-14", "hospital": "unknown", ...},
  {"date": "2026-12-15", "hospital": "unknown", ...}
]

ONLY JSON OUTPUT:`;

export type ParsedShift = {
    hospital_name: string | "unknown";
    ward_name: string | "unknown";
    shift_date: string | "unknown";
    start_time: string | "unknown";
    end_time: string | "unknown";
    pay_rate: number | "unknown";
    status?: "available" | "booked";
}

export async function parseShiftScreenshot(base64Image: string): Promise<ParsedShift[]> {
    try {
        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: 'image/jpeg',
                                data: base64Image,
                            },
                        },
                        {
                            type: 'text',
                            text: CLAUDE_PROMPT
                        }
                    ],
                },
            ],
        });

        const contentBlock = message.content[0];
        if (contentBlock.type === 'text') {
            console.log("--- CLAUDE RAW OUTPUT START ---");
            console.log(contentBlock.text);
            console.log("--- CLAUDE RAW OUTPUT END ---");

            const jsonMatch = contentBlock.text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const rawShifts = JSON.parse(jsonMatch[0]);
                // Map the AI's simplified keys to our internal keys
                return rawShifts.map((s: any) => ({
                    hospital_name: s.hospital || "unknown",
                    ward_name: s.ward || "unknown",
                    shift_date: s.date || "unknown",
                    start_time: s.start || "unknown",
                    end_time: s.end || "unknown",
                    pay_rate: s.rate === "unknown" ? "unknown" : Number(s.rate),
                    status: s.status === 'booked' ? 'booked' : 'available'
                }));
            } else {
                console.error("OCR Error: No JSON array found in response");
            }
        }
        throw new Error('Could not extract JSON from Claude response');

    } catch (error) {
        console.error('OCR Error:', error);
        return [];
    }
}

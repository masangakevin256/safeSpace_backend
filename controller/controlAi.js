// controllers/aiController.js
import axios from "axios";

// Test AI config
export const testAIConfig = async (req, res) => {
    const hfKey = process.env.HUGGING_FACE_API_KEYS;

    res.json({
        status: "AI support engine active",
        provider: "HuggingFace Router",
        hf_key_configured: !!hfKey,
        node_version: process.version,
        service: "Mental Health AI Assistant"
    });
};

// Main AI handler
export const askAI = async (req, res) => {
    const { message, history = [] } = req.body;
    const hfKey = process.env.HUGGING_FACE_API_KEYS;

    if (!hfKey) {
        return res.status(500).json({
            error: "AI service not configured (missing HF key)"
        });
    }

    if (!message) {
        return res.status(400).json({
            error: "Message is required"
        });
    }

    // System personality / rules
    const systemPrompt = `
You are an AI support assistant for a digital mental health platform called Jali Connect.

Your role:
- Provide calm, supportive, non-judgmental responses
- Encourage emotional expression
- Promote safety, care, and well-being
- Never give medical diagnoses
- Never replace professional counseling
- Escalate serious emotional distress gently
- Be empathetic, short, and human

Rules:
- Do not act as a therapist
- Do not give harmful instructions
- Always prioritize user safety
- If user expresses crisis signals, respond with care and encourage seeking help
`;

    const messages = [
        { role: "system", content: systemPrompt },

        // conversation memory
        ...history.map(h => ({
            role: h.role === "user" ? "user" : "assistant",
            content: h.content
        })),

        // new user message
        { role: "user", content: message }
    ];

    try {
        const response = await axios.post(
            "https://router.huggingface.co/v1/chat/completions",
            {
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages,
                temperature: 0.6,
                max_tokens: 400
            },
            {
                headers: {
                    Authorization: `Bearer ${hfKey}`,
                    "Content-Type": "application/json"
                },
                timeout: 30000
            }
        );

        const aiResponse = response.data?.choices?.[0]?.message?.content;

        if (!aiResponse) {
            throw new Error("Empty AI response");
        }

        res.json({
            status: "success",
            response: aiResponse.trim()
        });

    } catch (error) {
        console.error(
            "AI Engine Error:",
            error.response?.data || error.message
        );


        res.status(500).json({
            status: "error",
            error: "AI support service unavailable. Please try again."
        });
    }
};

// Analyze risk for check-ins
export const analyzeRisk = async (text) => {
    const hfKey = process.env.HUGGING_FACE_API_KEYS;
    if (!hfKey) {
        console.error("AI Risk Analysis skipped: Missing HF Key");
        return null;
    }

    const prompt = `
    Analyze the following user journal entry for mental health risk.
    entry: "${text}"
    
    Return ONLY a JSON object with this structure (no markdown, no other text):
    {
      "riskScore": (0-10 integer, where 10 is immediate danger),
      "category": "Safe" | "Moderate" | "High" | "Critical",
      "flags": ["list", "of", "detected", "issues", "e.g. Self-harm", "Suicide", "Depression"],
      "suggestedAction": "None" | "Suggest Resources" | "Contact Counselor" | "Emergency"
    }
  `;

    try {
        const response = await axios.post(
            "https://router.huggingface.co/v1/chat/completions",
            {
                model: "meta-llama/Meta-Llama-3-8B-Instruct",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.1, // Low temperature for consistent JSON
                max_tokens: 150
            },
            {
                headers: { Authorization: `Bearer ${hfKey}` },
                timeout: 10000 // Short timeout for background check
            }
        );

        const content = response.data?.choices?.[0]?.message?.content;
        const jsonMatch = content?.match(/\{[\s\S]*\}/); // Extract JSON if wrapped in text

        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(content); // Try parsing directly if no wrapper

    } catch (error) {
        console.error("Risk Analysis Error:", error.message);
        return null; // Fail safe, don't block check-in
    }
};

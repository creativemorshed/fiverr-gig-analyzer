export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { gigData, mode, gigUrl, gigInfo } = req.body;

  if (!gigData && !gigUrl && !gigInfo) {
    return res.status(400).json({ error: "No gig data provided" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  const userPrompt = mode === "url"
    ? `Fiverr Gig URL to analyze: ${gigUrl}\n\nAnalyze the URL structure (username, gig slug keywords, niche) and provide a comprehensive ranking analysis based on Fiverr's 2025 algorithm.`
    : `Analyze this Fiverr gig information:\n\n${gigInfo}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: `You are an expert Fiverr SEO analyst with deep knowledge of Fiverr's 2025 ranking algorithm. You know that:
- Success Score (1-10, relative to competitors in same price range) is the #1 ranking factor (25% weight)
- CTR (Click-Through Rate) is critical — impressions mean nothing without clicks (20% weight)
- Buyer satisfaction including PRIVATE reviews impacts Success Score heavily (15% weight)
- Gig SEO: title keyword at START, 5 optimized tags, description keyword density (12% weight)
- Repeat buyers signal trust and boost rankings (10% weight)
- On-time delivery rate affects Success Score directly (8% weight)
- Response rate 90%+ required for Level 1+, impacts visibility (6% weight)
- Profile completeness: bio, portfolio, intro video, skills (4% weight)

Return ONLY compact valid JSON (no markdown, no backticks, no newlines inside strings, all strings under 120 chars):
{"gigTitle":"...","sellerUsername":"...","niche":"...","overallScore":<0-100>,"rankTier":"<elite|strong|average|weak>","executiveSummary":"<2 sentences>","algorithmFactors":{"successScore":{"score":<0-100>,"insight":"...","urgency":"<high|medium|low>"},"ctr":{"score":<0-100>,"insight":"...","urgency":"<high|medium|low>"},"buyerSatisfaction":{"score":<0-100>,"insight":"...","urgency":"<high|medium|low>"},"gigSEO":{"score":<0-100>,"insight":"...","urgency":"<high|medium|low>"},"repeatBuyers":{"score":<0-100>,"insight":"...","urgency":"<high|medium|low>"},"deliveryTime":{"score":<0-100>,"insight":"...","urgency":"<high|medium|low>"},"responseRate":{"score":<0-100>,"insight":"...","urgency":"<high|medium|low>"},"profileComplete":{"score":<0-100>,"insight":"...","urgency":"<high|medium|low>"}},"titleAnalysis":{"currentTitle":"...","keywordPlacement":"<good|poor>","hasMainKeywordFirst":<true|false>,"suggestedTitle":"..."},"tagAnalysis":{"detectedTags":["..."],"tagQuality":"<good|poor>","missingKeywords":["..."]},"competitorEdge":"...","topWins":["...","...","..."],"criticalIssues":["...","..."],"quickWins":[{"action":"...","impact":"<high|medium>","timeframe":"<24h|1week|1month>"},{"action":"...","impact":"<high|medium>","timeframe":"<24h|1week|1month>"},{"action":"...","impact":"<high|medium>","timeframe":"<24h|1week|1month>"},{"action":"...","impact":"<high|medium>","timeframe":"<24h|1week|1month>"}],"algorithmNote":"..."}`,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: errData.error?.message || `Anthropic API error: ${response.status}` });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Robust JSON parse
    let clean = text.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    if (start === -1) throw new Error("No JSON found in response");
    clean = clean.slice(start);
    const lastBrace = clean.lastIndexOf("}");
    if (lastBrace !== -1) {
      clean = clean.slice(0, lastBrace + 1);
    } else {
      clean = clean.replace(/,\s*"[^"]*$/, "").replace(/,\s*$/, "");
      let o = 0, a = 0;
      for (const c of clean) {
        if (c === "{") o++; else if (c === "}") o--;
        else if (c === "[") a++; else if (c === "]") a--;
      }
      clean += "]".repeat(Math.max(0, a)) + "}".repeat(Math.max(0, o));
    }

    const parsed = JSON.parse(clean);
    return res.status(200).json({ success: true, result: parsed });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Analysis failed" });
  }
}

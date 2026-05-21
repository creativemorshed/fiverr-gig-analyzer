export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { mode, gigUrl, gigInfo } = req.body;
  if (!gigUrl && !gigInfo) return res.status(400).json({ error: "No gig data provided" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const userPrompt = mode === "url"
    ? `Fiverr Gig URL to analyze: ${gigUrl}\n\nAnalyze the URL structure (username, gig slug keywords, niche) and provide a comprehensive ranking analysis based on Fiverr's 2025 algorithm.`
    : `Analyze this Fiverr gig information:\n\n${gigInfo}`;

  const systemInstruction = `You are an expert Fiverr SEO analyst with deep knowledge of Fiverr's 2025 ranking algorithm. You know that:
- Success Score (1-10, relative to competitors in same price range) is the #1 ranking factor (25% weight)
- CTR (Click-Through Rate) is critical — impressions mean nothing without clicks (20% weight)
- Buyer satisfaction including PRIVATE reviews impacts Success Score heavily (15% weight)
- Gig SEO: title keyword at START, 5 optimized tags, description keyword density (12% weight)
- Repeat buyers signal trust and boost rankings (10% weight)
- On-time delivery rate affects Success Score directly (8% weight)
- Response rate 90%+ required for Level 1+, impacts visibility (6% weight)
- Profile completeness: bio, portfolio, intro video, skills (4% weight)

Return ONLY compact valid JSON (no markdown, no backticks, no newlines inside strings, all strings under 120 chars):
{"gigTitle":"...","sellerUsername":"...","niche":"...","overallScore":75,"rankTier":"strong","executiveSummary":"...","algorithmFactors":{"successScore":{"score":80,"insight":"...","urgency":"medium"},"ctr":{"score":70,"insight":"...","urgency":"medium"},"buyerSatisfaction":{"score":85,"insight":"...","urgency":"low"},"gigSEO":{"score":65,"insight":"...","urgency":"high"},"repeatBuyers":{"score":70,"insight":"...","urgency":"medium"},"deliveryTime":{"score":90,"insight":"...","urgency":"low"},"responseRate":{"score":80,"insight":"...","urgency":"low"},"profileComplete":{"score":75,"insight":"...","urgency":"medium"}},"titleAnalysis":{"currentTitle":"...","keywordPlacement":"good","hasMainKeywordFirst":true,"suggestedTitle":"..."},"tagAnalysis":{"detectedTags":["tag1","tag2"],"tagQuality":"good","missingKeywords":["kw1","kw2"]},"competitorEdge":"...","topWins":["win1","win2","win3"],"criticalIssues":["issue1","issue2"],"quickWins":[{"action":"...","impact":"high","timeframe":"24h"},{"action":"...","impact":"high","timeframe":"1week"},{"action":"...","impact":"medium","timeframe":"1week"},{"action":"...","impact":"medium","timeframe":"1month"}],"algorithmNote":"..."}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
        })
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let clean = text.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    if (start === -1) throw new Error("No JSON found");
    clean = clean.slice(start);
    const lastBrace = clean.lastIndexOf("}");
    if (lastBrace !== -1) clean = clean.slice(0, lastBrace + 1);
    else {
      clean = clean.replace(/,\s*"[^"]*$/, "").replace(/,\s*$/, "");
      let o = 0, a = 0;
      for (const c of clean) {
        if (c === "{") o++; else if (c === "}") o--;
        else if (c === "[") a++; else if (c === "]") a--;
      }
      clean += "]".repeat(Math.max(0, a)) + "}".repeat(Math.max(0, o));
    }

    return res.status(200).json({ success: true, result: JSON.parse(clean) });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Analysis failed" });
  }
}

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for Gemini Insights
  app.post("/api/gemini-insight", async (req, res) => {
    try {
      const { orderHistory, budgetProgress, pendingCount, persona, potentialSavings = 0, dueItemsSummary = "" } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          insight: potentialSavings > 0
            ? `Consolidating your due essentials today can save you up to ₹${potentialSavings} in Swiggy Instamart delivery fees!`
            : "Bundle your weekly groceries on Swiggy Instamart to save on delivery fees."
        });
      }

      // ==== DASH-API-GEMINI ====
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      const prompt = `You are GharLoop AI, an intelligent recurring-essentials planner for Indian households.
Analyze the following user profile and metrics:
- Persona: ${persona || "Family Planner"}
- Monthly Budget Progress: Spent ${budgetProgress?.spent || 0} INR out of ${budgetProgress?.limit || 5000} INR
- Order History (Last 30 Days): ${JSON.stringify(orderHistory || [])}
- Pending Approvals right now: ${pendingCount || 0} items
- Items due today/overdue: ${dueItemsSummary || "None"}
- Pre-calculated potential delivery fee savings if consolidated: ₹${potentialSavings}

Write exactly ONE friendly, highly actionable and clear custom household or scheduling advice sentence in plain text (maximum 18 words, no bullet points, no asterisks, no quotes, no markdown).
If the potential fee savings are greater than zero (₹${potentialSavings}), write a delivery-consolidation insight mentioning that consolidating their due items can save them ₹${potentialSavings} in Swiggy delivery fees. Otherwise, provide a helpful general budget or delivery saving advice.
Example: "Consolidating your due essentials today saves ₹${potentialSavings || 50} in Swiggy Instamart delivery fees."`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      let text = response.text?.trim() || "";
      // Strip any markdown double asterisks, quotes or extra symbols
      text = text.replace(/[*#`"]/g, "");
      
      res.json({ insight: text || "Try bundling your weekly groceries on Swiggy Instamart to save on delivery charges." });
    } catch (error) {
      console.error("Gemini API error:", error);
      res.json({ insight: "Try bundling your weekly groceries on Swiggy Instamart to save on delivery charges." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

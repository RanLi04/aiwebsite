import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  const sessionsStore = new Map<string, any>();

  app.get("/api/sessions", (req, res) => {
    const sessions = Array.from(sessionsStore.values()).sort((a,b) => b.updatedAt - a.updatedAt);
    res.json(sessions);
  });

  app.post("/api/sessions", (req, res) => {
    const { id, title, updatedAt, messages } = req.body;
    if (!id) return res.status(400).json({ error: "Missing session id" });
    
    sessionsStore.set(id, { id, title: title || "新会话", updatedAt: updatedAt || Date.now(), messages: messages || [] });
    res.json({ success: true });
  });

  // API Route for chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, modelId } = req.body;
      
      if (!messages || messages.length === 0) {
        return res.status(400).json({ error: "No messages provided." });
      }

      /* 
       * ==========================================
       * EXTERNAL API ROUTING SLOTS (HIDDEN FROM UI)
       * ==========================================
       * All API keys map here on the server side so they are 
       * never leaked to the client/browser memory.
       */
      
      if (modelId && modelId.startsWith("deepseek-")) {
        const deepKey = process.env.DEEPSEEK_API_KEY;
        // 🔒 Server-Side Deployment Principles (For your production):
        // 1. The front-end React app only sends {"modelId": "deepseek-reasoner"}
        // 2. The front-end NEVER knows the `deepKey` or the external endpoint.
        // 3. This Node.js server authenticates with https://api.deepseek.com securely.
        // 4. We stream the result back text by text to the client.
        if (deepKey) {
          // fetch('https://api.deepseek.com/v1/chat/completions', { ... });
        }
        // If no secret key is provided, we intentionally fall through to standard Gemini mapping
        // to provide a smooth simulation in the build preview.
      } else if (modelId && modelId.startsWith("fenghechat-")) {
        const fenghechatKey = process.env.FENGHECHAT_API_KEY;
        // 🔒 Server-Side Deployment Principles (For your production):
        // 1. The front-end React app sends {"modelId": "fenghechat-pro"}
        // 2. This Node.js server handles the actual API request to your self-hosted engine 
        //    (via Ollama, vLLM, Together AI, etc.) securely without exposing the endpoint.
        if (fenghechatKey) {
           // fetch('your-fenghechat-endpoint/v1/chat/completions', { ... })
        }
      }

      // Map user selected UI models to underlying Gemini models for simulation
      let geminiModel = "gemini-3.5-flash";
      const modelMap: Record<string, string> = {
        "fenghechat-unlimited": "gemini-3.1-pro-preview",
        "fenghechat-pro": "gemini-3.1-pro-preview",
        "fenghechat-flash": "gemini-3.5-flash",
        "fenghechat-mini": "gemini-3.1-flash-lite",
        "deepseek-reasoner": "gemini-3.1-pro-preview", // Fallback simulation
        "deepseek-chat": "gemini-3.1-pro-preview",
      };
      
      if (modelMap[modelId]) {
        geminiModel = modelMap[modelId];
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });

      // Prepare history and current input
      const historyMsg = messages.slice(0, -1).map((m: any) => `${m.role}: ${m.text}`).join('\n\n');
      const currentInput = messages[messages.length - 1].text;

      let finalPrompt = currentInput;
      if (historyMsg) {
        finalPrompt = `Below is the conversation history:\n${historyMsg}\n\nNext user message (respond according to the persona):\n${currentInput}`;
      }

      const responseStream = await ai.models.generateContentStream({
        model: geminiModel,
        contents: finalPrompt,
        config: {
          systemInstruction: "You are a helpful conversational AI.",
        }
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      for await (const chunk of responseStream) {
        if (chunk.text) {
          const data = JSON.stringify({ text: chunk.text });
          res.write(`data: ${data}\n\n`);
        }
      }
      
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      console.error("Chat API error:", error);
      res.status(500).json({ error: error.message || "Something went wrong" });
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
    // Production serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

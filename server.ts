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

      // Map user selected UI models
      const modelMap: Record<string, string> = {
        "fenghechat-unlimited": "huihui_ai/gemma-4-abliterated:26b",
        "fenghechat-pro": "huihui_ai/gemma-4-abliterated:26b",
        "fenghechat-flash": "gemma3:12b",
        "fenghechat-mini": "gemma3:4b",
        "deepseek-reasoner": "gemma3:27b",
        "deepseek-chat": "gemma3:27b",
      };
      const localModel = modelMap[modelId] || "gemma3:12b";

      // 1. FORMAT MESSAGES
      const formattedMessages = [
        { role: "system", content: "You are a helpful conversational AI." },
        ...messages.map((m: any) => ({
          role: m.role === "model" ? "assistant" : "user",
          content: m.text,
        })),
      ];

      // 2. CONNECT TO OLLAMA (Local)
      const baseURL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1";

      const response = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: localModel,
          messages: formattedMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "Unknown error");
        throw new Error(`Ollama API error (${response.status}): ${errText}`);
      }

      if (!response.body) {
        throw new Error("No response body from Ollama API");
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let sseLineBuffer = "";
      let delayBuffer = "";
      const blockedTokens = ["<end_of_turn>", "<start_of_turn>", "<eos>", "<bos>", "<|im_start|>", "<|im_end|>"];

      while (true) {
        const { done, value } = await reader.read();
        
        let chunkStr = "";
        if (value) {
            chunkStr = decoder.decode(value, { stream: true });
        }
        
        sseLineBuffer += chunkStr;
        const lines = sseLineBuffer.split('\n');
        sseLineBuffer = lines.pop() || "";
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(dataStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              delayBuffer += content;
              
              for (const token of blockedTokens) {
                 delayBuffer = delayBuffer.split(token).join("");
              }
              delayBuffer = delayBuffer.replace(/\n{3,}/g, "\n\n");
              
              if (delayBuffer.length > 20) {
                 const safeEmit = delayBuffer.slice(0, -20);
                 delayBuffer = delayBuffer.slice(-20);
                 res.write(`data: ${JSON.stringify({ text: safeEmit })}\n\n`);
              }
            }
          } catch(e) {
            // ignore partial JSON
          }
        }
        
        if (done) break;
      }
      
      if (delayBuffer) {
        for (const token of blockedTokens) {
           delayBuffer = delayBuffer.split(token).join("");
        }
        delayBuffer = delayBuffer.replace(/\n{3,}/g, "\n\n");
        if (delayBuffer) {
           res.write(`data: ${JSON.stringify({ text: delayBuffer })}\n\n`);
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

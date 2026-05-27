import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  const SESSIONS_FILE = path.join(process.cwd(), "sessions.json");
  
  const getSessionsStore = (): Record<string, any> => {
    try {
      if (fs.existsSync(SESSIONS_FILE)) {
        const data = fs.readFileSync(SESSIONS_FILE, "utf-8");
        return JSON.parse(data);
      }
    } catch(e) {
      console.error("Error reading sessions file:", e);
    }
    return {};
  };

  const saveSessionsStore = (store: Record<string, any>) => {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(store, null, 2), "utf-8");
    } catch(e) {
      console.error("Error writing sessions file:", e);
    }
  };

  app.get("/api/sessions", (req, res) => {
    const clientId = req.headers["x-client-id"] || "anonymous";
    const store = getSessionsStore();
    const sessions = Object.values(store)
      .filter((s: any) => s.clientId === clientId)
      .sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    res.json(sessions);
  });

  app.post("/api/sessions", (req, res) => {
    const clientId = req.headers["x-client-id"] || "anonymous";
    const { id, title, updatedAt, messages } = req.body;
    if (!id) return res.status(400).json({ error: "Missing session id" });
    
    const store = getSessionsStore();
    if (store[id] && store[id].clientId && store[id].clientId !== clientId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    store[id] = { id, title: title || "新会话", updatedAt: updatedAt || Date.now(), messages: messages || [], clientId };
    saveSessionsStore(store);
    
    res.json({ success: true });
  });

  app.delete("/api/sessions/:id", (req, res) => {
    const clientId = req.headers["x-client-id"] || "anonymous";
    const { id } = req.params;
    const store = getSessionsStore();
    if (store[id]) {
       if (store[id].clientId && store[id].clientId !== clientId) {
           return res.status(403).json({ error: "Forbidden" });
       }
       delete store[id];
       saveSessionsStore(store);
    }
    res.json({ success: true });
  });

  // API Route for chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, modelId, isWebSearchMode } = req.body;
      
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

      let systemPrompt = "You are a helpful conversational AI.";
      
      if (isWebSearchMode && messages.length > 0) {
         try {
             const lastUserMsg = messages[messages.length - 1].text;
             const jinaRes = await fetch(`https://s.jina.ai/?q=${encodeURIComponent(lastUserMsg)}`, {
                 headers: { "Accept": "text/plain" }
             });
             if (jinaRes.ok) {
                 const searchResults = await jinaRes.text();
                 systemPrompt += `\n\n[Search Results for Context]\n${searchResults}\n\nPlease use the above recent information to help answer the user's query if it is relevant.`;
             }
         } catch (e) {
             console.error("Jina Search error:", e);
         }
      }

      // 1. FORMAT MESSAGES
      const formattedMessages = [
        { role: "system", content: systemPrompt },
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
      res.flushHeaders();

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
            let content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              for (const token of blockedTokens) {
                 content = content.split(token).join("");
              }
              if (content) {
                 res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
              }
            }
          } catch(e) {
            // ignore partial JSON
          }
        }
        
        if (done) break;
      }
      
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      if (error.name === "AbortError" || error.message?.includes("aborted")) {
        console.log("Chat streaming aborted by client.");
        return res.end();
      }
      console.error("Chat API error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Something went wrong" });
      }
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

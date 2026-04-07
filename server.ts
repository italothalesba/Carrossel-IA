import express from "express";
import { createServer as createViteServer } from "vite";
import { Pinecone } from '@pinecone-database/pinecone';
import path from "path";

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  const PORT = 3000;

  // Initialize Pinecone
  let pc: Pinecone | null = null;
  const INDEX_NAME = 'carousel-styles';

  const initPinecone = async () => {
    // Using the key provided by the user as fallback to ensure it works immediately
    const apiKey = process.env.PINECONE_API_KEY || "pcsk_2d2RyJ_CitnsLLN597q6cQSGkRRATsn9dc9PZUCe5TFJtStixRRPpY4mmdVAGpmAnkotHt";
    
    if (!apiKey) {
      console.warn("PINECONE_API_KEY is missing. Pinecone features will be disabled.");
      return;
    }
    
    pc = new Pinecone({ apiKey });
    
    try {
      const indexes = await pc.listIndexes();
      const indexExists = indexes.indexes?.some(idx => idx.name === INDEX_NAME);
      
      if (!indexExists) {
        console.log(`Creating Pinecone index: ${INDEX_NAME}...`);
        await pc.createIndex({
          name: INDEX_NAME,
          dimension: 768, // gemini-embedding-2-preview dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        console.log('Index created.');
      } else {
        console.log(`Pinecone index ${INDEX_NAME} already exists.`);
      }
    } catch (e) {
      console.error("Error initializing Pinecone index:", e);
    }
  };

  await initPinecone();

  app.post('/api/pinecone/upsert', async (req, res) => {
    if (!pc) return res.status(500).json({ error: "Pinecone not configured" });
    try {
      const { id, values, metadata } = req.body;
      const index = pc.index(INDEX_NAME);
      await index.upsert({ records: [{ id, values, metadata }] });
      res.json({ success: true });
    } catch (error: any) {
      console.error("Pinecone upsert error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/pinecone/query', async (req, res) => {
    if (!pc) return res.status(500).json({ error: "Pinecone not configured" });
    try {
      const { vector } = req.body;
      const index = pc.index(INDEX_NAME);
      const queryResponse = await index.query({
        vector,
        topK: 1,
        includeMetadata: true
      });
      res.json({ matches: queryResponse.matches });
    } catch (error: any) {
      console.error("Pinecone query error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware
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

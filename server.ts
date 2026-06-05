import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { analyzeFace } from './src/services/faceAnalysis';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON and urlencoded with a large limit for base64 images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API route
  app.post('/api/analyze', async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 is required' });
      }
      
      const data = await analyzeFace(imageBase64);
      res.json(data);
    } catch (e: any) {
      console.error('Face Analysis Error:', e);
      res.status(500).json({ error: e.message || 'Analysis failed. Try another selfie.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

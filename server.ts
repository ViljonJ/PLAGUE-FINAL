import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from 'url';
import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Connect to MongoDB if URI is provided
  const mongoURI = process.env.MONGODB_URI;
  if (mongoURI) {
    try {
      await mongoose.connect(mongoURI);
      console.log("Successfully connected to MongoDB.");
    } catch (error: any) {
      console.error("MongoDB connection error:", error);
      if (error && error.name === 'MongooseServerSelectionError') {
        console.warn("\n⚠️ IMPORTANT: To fix this error, you need to configure your MongoDB Atlas cluster to allow access from any IP address.");
        console.warn("1. Go to your MongoDB Atlas Dashboard");
        console.warn("2. Click on 'Network Access' on the left sidebar");
        console.warn("3. Click 'Add IP Address'");
        console.warn("4. Click 'ALLOW ACCESS FROM ANYWHERE' (this sets the IP to 0.0.0.0/0)");
        console.warn("5. Click 'Confirm' and wait for it to become Active\n");
      }
    }
  } else {
    console.warn("MONGODB_URI not found in environment. MongoDB features will be disabled.");
  }

  // Contact API
  app.post("/api/contact", async (req, res) => {
    const { name, email, message } = req.body;
    console.log(`Received contact form from ${name} (${email}): ${message}`);

    // If SMTP is configured, send actual email
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');

    if (smtpUser && smtpPass) {
      try {
        const nodemailer = await import("nodemailer");
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"Plague System" <${smtpUser}>`,
          to: "plaguesupport@gmail.com",
          subject: `Plague Inquiry from ${name}`,
          text: `Message: ${message}\n\nFrom: ${name} (${email})`,
        });

        console.log("Email sent successfully via SMTP.");
      } catch (error) {
        console.error("Failed to send email via SMTP:", error);
      }
    } else {
      console.warn("SMTP credentials not provided. Email not sent, only logged to console.");
    }

    res.json({ success: true, message: "Transmission received" });
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // --- MongoDB User API ---

  const UserSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    // strict: false allows dynamic schema for user stats
  }, { strict: false });

  const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

  // Fallback in-memory map for when MongoDB is not connected
  const inMemoryDB = new Map<string, any>();

  app.get("/api/users/:uid", async (req, res) => {
    if (!mongoose.connection.readyState) {
      const user = inMemoryDB.get(req.params.uid);
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json(user);
    }
    try {
      const user = await UserModel.findOne({ uid: req.params.uid } as any);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/users/:uid", async (req, res) => {
    if (!mongoose.connection.readyState) {
      const { uid, ...data } = req.body;
      const existing = inMemoryDB.get(req.params.uid) || { uid: req.params.uid };
      const updated = { ...existing, ...data };
      inMemoryDB.set(req.params.uid, updated);
      return res.json(updated);
    }
    try {
      const { uid, ...data } = req.body;
      const user = await UserModel.findOneAndUpdate(
        { uid: req.params.uid } as any,
        { $set: data },
        { new: true, upsert: true }
      );
      res.json(user);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/users/:uid", async (req, res) => {
    if (!mongoose.connection.readyState) {
      const { uid, ...data } = req.body;
      const existing = inMemoryDB.get(req.params.uid) || { uid: req.params.uid };
      const updated = { ...existing, ...data };
      inMemoryDB.set(req.params.uid, updated);
      return res.json(updated);
    }
    try {
      const { uid, ...data } = req.body;
      const user = await UserModel.findOneAndUpdate(
        { uid: req.params.uid } as any,
        { $set: data },
        { new: true, upsert: true }
      );
      res.json(user);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: !isHmrDisabled,
        host: '0.0.0.0',
        port: 3000
      },
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

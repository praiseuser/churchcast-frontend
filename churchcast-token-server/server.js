import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AccessToken } from "livekit-server-sdk";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL, PORT = 4001 } = process.env;

app.post("/token", async (req, res) => {
  const { roomName, participantName } = req.body;
  if (!roomName || !participantName) {
    return res.status(400).json({ error: "roomName and participantName are required" });
  }

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantName,
  });
  at.addGrant({ roomJoin: true, room: roomName });

  const token = await at.toJwt();
  res.json({ token, url: LIVEKIT_URL });
});

app.listen(PORT, () => console.log(`Token server running on http://localhost:${PORT}`));
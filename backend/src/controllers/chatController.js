
import { getChatReply } from "../services/chatService.js";

export async function chat(req, res, next) {
  try {
    const { message, history } = req.body;
    if (!message || message.trim() === "") {
      return res.status(400).json({ error: "message is required" });
    }
    const reply = await getChatReply(message.trim(), history || []);
    res.json({ success: true, reply });
  } catch (err) {
    next(err);
  }
}
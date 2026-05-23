// backend/src/config/twilio.js
import twilio from "twilio";

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;

if (!ACCOUNT_SID || !AUTH_TOKEN) {
  console.warn("⚠️  Twilio env vars missing — SMS notifications will fail.");
}

const twilioClient = twilio(ACCOUNT_SID, AUTH_TOKEN);

export default twilioClient;
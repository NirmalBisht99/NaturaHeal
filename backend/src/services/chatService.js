// backend/src/services/chatService.js
// ─────────────────────────────────────────────────────────────
//  Gemini-powered chat service for NaturaHeal
//  ALL product data comes from Supabase — nothing is hardcoded.
//  Keyword fallback also uses live DB data, not static strings.
// ─────────────────────────────────────────────────────────────

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getActiveProducts }  from "./productService.js";

// ── Product cache (2-minute TTL) ──────────────────────────────
let productCache     = null;
let productCacheTime = 0;
const CACHE_TTL_MS   = 2 * 60 * 1000;

// Returns the raw products array (cached)
async function getProducts() {
  const now = Date.now();
  if (productCache && now - productCacheTime < CACHE_TTL_MS) return productCache;

  try {
    const products = await getActiveProducts();
    productCache     = products || [];
    productCacheTime = now;
    return productCache;
  } catch (err) {
    console.warn("[chatService] Could not fetch products from DB:", err.message);
    // Return cached data even if stale — better than nothing
    return productCache || [];
  }
}

// Formats the product list into a context string for Gemini
function formatProductContext(products) {
  if (!products || products.length === 0) {
    return "No products are currently available in the catalog.";
  }

  const inStock    = products.filter((p) => p.stock > 0);
  const outOfStock = products.filter((p) => p.stock === 0);

  let ctx = "IN STOCK:\n" + inStock.map((p) =>
    `• ${p.name}` +
    ` | Category: ${p.category}` +
    ` | Price: ₹${p.price}${p.original_price ? ` (was ₹${p.original_price})` : ""}` +
    ` | Stock: ${p.stock} units` +
    (p.badge ? ` | Tag: ${p.badge}` : "") +
    ` | Rating: ${p.rating || 4.5}/5 (${p.review_count || 0} reviews)` +
    (p.description ? ` | About: ${p.description.slice(0, 150)}` : "")
  ).join("\n");

  if (outOfStock.length > 0) {
    ctx += "\n\nOUT OF STOCK (never recommend these):\n";
    ctx += outOfStock.map((p) => `• ${p.name} (${p.category})`).join("\n");
  }

  return ctx;
}

// ── System prompt (fully dynamic — no hardcoded products) ─────
function buildSystemPrompt(productContext) {
  return `
You are Priya, a warm and knowledgeable Ayurvedic wellness consultant for NaturaHeal — a premium homeopathic medicine store based in India.

Your personality: caring, conversational, patient. You speak in warm Indian-English. You listen before you recommend.

═══ CRITICAL RULES ═══
1. ONLY recommend products that appear in the CURRENT CATALOG below. Never invent products.
2. NEVER recommend OUT OF STOCK products.
3. Always quote the exact price from the catalog.
4. ALWAYS end every response with suggestion chips in this exact format on its own line:
   💬 Quick replies: "Option 1" | "Option 2" | "Option 3"
5. Keep responses under 150 words. Use **bold** for product names.

═══ CONVERSATION FLOW ═══
When a customer mentions a health concern for the first time:
  → Ask ONE short clarifying question first, then add quick reply chips.

After they give context:
  → Recommend the most relevant IN STOCK product(s) from the catalog with price and benefits.
  → End with: "You can add this from the Shop section! 🛒"
  → Add quick reply chips.

For direct questions about products, price, delivery, payment, returns:
  → Answer immediately, then add quick reply chips.

═══ STORE POLICIES ═══
• Delivery: FREE on orders above ₹499, otherwise ₹49 flat. 3–7 business days.
• Payment: Cash on Delivery (COD) + Razorpay (UPI, Cards, Net Banking, Wallets). 256-bit SSL.
• Returns: 7-day easy return policy. Contact namaste@naturaheal.in or +91 7579189494.
• All products: AYUSH certified, GMP verified, no synthetic additives.
• Order tracking: under "My Orders" after login. SMS updates at every step.

═══ CONTACT ═══
• Email: namaste@naturaheal.in
• Phone / WhatsApp: +91 7579189494
• Hours: Mon–Sat, 9AM–7PM IST

═══ CURRENT PRODUCT CATALOG (live from database) ═══
${productContext}

═══ HOW TO RECOMMEND ═══
- Read the catalog above carefully. Match the customer's health concern to the most relevant product(s).
- If the catalog has nothing relevant, say so honestly and suggest they contact us.
- If combined order total exceeds ₹499, always mention FREE delivery.
- For serious conditions always add: "Please also consult a qualified doctor."

═══ QUICK REPLY CHIPS FORMAT ═══
Always end EVERY response with:
💬 Quick replies: "Option A" | "Option B" | "Option C"

Pick chips relevant to the conversation. Examples:
- After mentioning a symptom: clarifying questions as chips
- After a recommendation: "Tell me more" | "Any side effects?" | "How to use it?"
- After delivery info: "Shop now" | "Payment options" | "Return policy"
`.trim();
}

// ── Try a specific Gemini model ───────────────────────────────
async function tryGemini(modelName, systemPrompt, history, userMessage) {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI  = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: 400,
      temperature:     0.8,
      topP:            0.9,
    },
  });

  const chat   = model.startChat({ history });
  const result = await chat.sendMessage(userMessage);
  const text   = result.response.text();
  return text ? text.trim() : null;
}

// ── Main export ───────────────────────────────────────────────
export async function getChatReply(userMessage, conversationHistory) {
  const apiKey = process.env.GEMINI_API_KEY;

  // Always fetch live products first — used by both Gemini and fallback
  const products = await getProducts();

  if (!apiKey) {
    console.warn("[chatService] GEMINI_API_KEY not set — using keyword fallback");
    return getKeywordReply(userMessage, products);
  }

  const productContext = formatProductContext(products);
  const systemPrompt   = buildSystemPrompt(productContext);

  // Build history (prior messages only, NOT the current message)
  const history = (conversationHistory || [])
    .slice(-10)
    .map((msg) => ({
      role:  msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

  // Try models in order: gemini-2.0-flash → gemini-1.5-flash
  for (const modelName of ["gemini-2.0-flash", "gemini-1.5-flash"]) {
    try {
      const text = await tryGemini(modelName, systemPrompt, history, userMessage);
      if (text) {
        console.log(`[chatService] ✅ ${modelName} responded`);
        return text;
      }
    } catch (err) {
      const isQuota = err.status === 429
        || (err.message && (err.message.includes("429") || err.message.toLowerCase().includes("quota")));

      if (isQuota) {
        console.warn(`[chatService] ${modelName} quota exceeded — trying next`);
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      console.error(`[chatService] ${modelName} error:`, err.message);
      break;
    }
  }

  // All Gemini models failed — use keyword fallback with live product data
  console.warn("[chatService] Gemini unavailable — using keyword fallback with live products");
  return getKeywordReply(userMessage, products);
}

// ── Keyword fallback using LIVE products from DB ──────────────
// Searches the actual product list for relevant matches.
// No product names, prices, or descriptions are hardcoded here.
function getKeywordReply(message, products) {
  const m       = message.toLowerCase();
  const inStock = (products || []).filter((p) => p.stock > 0);

  // Helper: find products matching a category keyword
  const byCategory = (keyword) =>
    inStock.filter((p) => p.category.toLowerCase().includes(keyword));

  // Helper: find products matching keywords in name or description
  const byKeyword = (...keywords) =>
    inStock.filter((p) => {
      const haystack = `${p.name} ${p.description || ""}`.toLowerCase();
      return keywords.some((k) => haystack.includes(k));
    });

  // Helper: format a single product for display
  const fmt = (p) => {
    const price = p.original_price
      ? `₹${p.price} (was ₹${p.original_price})`
      : `₹${p.price}`;
    const delivery = p.price >= 499 ? " FREE delivery!" : "";
    return `**${p.name}** (${price})${delivery}`;
  };

  // Helper: format a list of products as bullet points
  const fmtList = (prods) =>
    prods.map((p) => `• ${fmt(p)}`).join("\n");

  // If no products loaded yet
  if (inStock.length === 0) {
    return "Namaste! 🌿 Our catalog is loading. Please try again in a moment, or browse the Shop section directly!\n\n💬 Quick replies: \"Try again\" | \"Contact support\"";
  }

  // ── Skin / acne / eczema ───────────────────────────────────
  if (m.includes("skin") || m.includes("acne") || m.includes("pimple")
    || m.includes("eczema") || m.includes("rash") || m.includes("breakout")) {
    const matches = byCategory("skin").concat(byKeyword("acne", "skin", "neem", "eczema", "rash"));
    const unique  = [...new Map(matches.map((p) => [p.id, p])).values()];
    if (unique.length > 0) {
      const p = unique[0];
      return `For skin problems and acne, I'd recommend:\n\n${fmt(p)} ✨\n\n${p.description ? p.description.slice(0, 100) + "…" : ""}\n\nShop → ${p.category}. 🛒\n\n💬 Quick replies: "How long for results?" | "Good for oily skin?" | "Any side effects?"`;
    }
  }

  // ── Sleep / insomnia ───────────────────────────────────────
  if (m.includes("sleep") || m.includes("insomnia")) {
    const hasContext = m.includes("stress") || m.includes("anxiety")
      || m.includes("mind") || m.includes("related");
    if (!hasContext) {
      return "I'm sorry to hear you're having trouble sleeping 😔 To suggest the best remedy — is this mostly because of stress and an overactive mind, or do you struggle to sleep even when relaxed?\n\n💬 Quick replies: \"It's stress-related\" | \"Mind won't stop racing\" | \"Both\"";
    }
    const matches = byCategory("stress").concat(byKeyword("sleep", "stress", "ashwagandha", "calm", "cortisol"));
    const unique  = [...new Map(matches.map((p) => [p.id, p])).values()];
    if (unique.length > 0) {
      return `Based on what you've shared, here's what I recommend:\n\n${fmtList(unique.slice(0, 2))}\n\nShop → Stress & Sleep. 🛒\n\n💬 Quick replies: "Tell me more" | "Any side effects?" | "How long to see results?"`;
    }
  }

  // ── Stress / anxiety ───────────────────────────────────────
  if (m.includes("stress") || m.includes("anxiety") || m.includes("tension") || m.includes("worry")) {
    const hasContext = m.includes("work") || m.includes("exam") || m.includes("always") || m.includes("daily");
    if (!hasContext) {
      return "I understand — stress can really drain you 🙏 Is this mostly work/exam pressure, or more of a general anxious feeling throughout the day?\n\n💬 Quick replies: \"Work pressure\" | \"General anxiety\" | \"Exam stress\"";
    }
    const matches = byCategory("stress").concat(byKeyword("stress", "ashwagandha", "anxiety", "cortisol", "calm"));
    const unique  = [...new Map(matches.map((p) => [p.id, p])).values()];
    if (unique.length > 0) {
      return `For stress and anxiety, I recommend:\n\n${fmtList(unique.slice(0, 2))}\n\nShop → Stress & Sleep. 🛒\n\n💬 Quick replies: "Tell me more" | "How do I take it?" | "Side effects?"`;
    }
  }

  // ── Digestion ──────────────────────────────────────────────
  if (m.includes("digest") || m.includes("stomach") || m.includes("constip")
    || m.includes("bloat") || m.includes("gas") || m.includes("acidity")
    || m.includes("acid") || m.includes("heartburn")) {
    const matches = byCategory("digest").concat(byKeyword("digest", "constip", "bloat", "acid", "haritaki", "stomach"));
    const unique  = [...new Map(matches.map((p) => [p.id, p])).values()];
    if (unique.length > 0) {
      return `For digestive issues, I recommend:\n\n${fmtList(unique.slice(0, 2))}\n\nShop → Digestion. 🛒\n\n💬 Quick replies: "Tell me more" | "Is it safe daily?" | "How long to take?"`;
    }
  }

  // ── Immunity / fever / flu ─────────────────────────────────
  if (m.includes("immun") || m.includes("fever") || m.includes("flu")
    || m.includes("viral") || m.includes("sick") || m.includes("cold")
    || m.includes("cough")) {
    const matches = byCategory("immun").concat(byKeyword("immun", "fever", "tulsi", "giloy", "amla", "viral"));
    const unique  = [...new Map(matches.map((p) => [p.id, p])).values()];
    if (unique.length > 0) {
      const total = unique.slice(0, 3).reduce((s, p) => s + p.price, 0);
      const delivery = total >= 499 ? " FREE delivery!" : "";
      return `For immunity, here are our best remedies:\n\n${fmtList(unique.slice(0, 3))}\n\nAll AYUSH certified, GMP verified.${delivery} Shop → Immunity. 🛒\n\n💬 Quick replies: "Which is most important?" | "Tell me about each" | "Add all"`;
    }
  }

  // ── Memory / brain / focus ─────────────────────────────────
  if (m.includes("memory") || m.includes("focus") || m.includes("concentrat")
    || m.includes("brain") || m.includes("study")) {
    const matches = byCategory("child").concat(byKeyword("memory", "brain", "focus", "brahmi", "concentrat", "study"));
    const unique  = [...new Map(matches.map((p) => [p.id, p])).values()];
    if (unique.length > 0) {
      return `For memory and focus, I recommend:\n\n${fmtList(unique.slice(0, 2))}\n\nShop → Children's (great for adults too!). 🛒\n\n💬 Quick replies: "Safe for what age?" | "How soon does it work?" | "Tell me more"`;
    }
  }

  // ── Women's health ─────────────────────────────────────────
  if (m.includes("women") || m.includes("period") || m.includes("hormonal")
    || m.includes("pcos") || m.includes("pcod") || m.includes("menstrual")) {
    const matches = byKeyword("women", "hormonal", "shatavari", "period", "menstrual", "reproductive");
    const unique  = [...new Map(matches.map((p) => [p.id, p])).values()];
    if (unique.length > 0) {
      return `For women's health, I recommend:\n\n${fmtList(unique.slice(0, 2))}\n\nShop → Pain Relief. 🛒 Please also consult a doctor.\n\n💬 Quick replies: "Tell me more" | "Safe long-term?" | "Any side effects?"`;
    }
  }

  // ── Children ───────────────────────────────────────────────
  if (m.includes("child") || m.includes("kid") || m.includes("baby")) {
    const matches = byCategory("child").concat(byKeyword("child", "kids", "brahmi", "safe for children"));
    const unique  = [...new Map(matches.map((p) => [p.id, p])).values()];
    if (unique.length > 0) {
      return `For children's health, I recommend:\n\n${fmtList(unique.slice(0, 2))}\n\nShop → Children's. 🛒 Please consult a paediatrician first.\n\n💬 Quick replies: "From what age?" | "Tell me more" | "Any side effects?"`;
    }
  }

  // ── Pain relief ────────────────────────────────────────────
  if (m.includes("pain") || m.includes("joint") || m.includes("muscle") || m.includes("ache")) {
    const matches = byCategory("pain").concat(byKeyword("pain", "joint", "muscle", "relief"));
    const unique  = [...new Map(matches.map((p) => [p.id, p])).values()];
    if (unique.length > 0) {
      return `For pain relief, I recommend:\n\n${fmtList(unique.slice(0, 2))}\n\nShop → Pain Relief. 🛒 Please also consult a doctor.\n\n💬 Quick replies: "Tell me more" | "How to use?" | "Any side effects?"`;
    }
  }

  // ── Policy questions ───────────────────────────────────────
  if (m.includes("deliver") || m.includes("shipping")) {
    return "📦 **FREE delivery on orders above ₹499!** Otherwise ₹49 flat.\n\nDelivery takes 3–7 business days across India, with SMS updates at every step!\n\n💬 Quick replies: \"Shop now\" | \"Payment options\" | \"Return policy\"";
  }

  if (m.includes("pay") || m.includes("cod") || m.includes("upi") || m.includes("payment")) {
    return "We accept:\n• **Cash on Delivery (COD)**\n• **Razorpay** — UPI, Cards, Net Banking, Wallets\n\nAll secured with 256-bit SSL. 🔒\n\n💬 Quick replies: \"Shop now\" | \"Delivery info\" | \"Return policy\"";
  }

  if (m.includes("return") || m.includes("refund") || m.includes("cancel")) {
    return "**7-day easy return policy!** 🙏 Email namaste@naturaheal.in or WhatsApp +91 7579189494 with your order ID.\n\n💬 Quick replies: \"Contact support\" | \"Track order\" | \"Shop more\"";
  }

  if (m.includes("order") || m.includes("track") || m.includes("status")) {
    return "Track your order under **'My Orders'** after logging in. SMS updates at every delivery step! 📱\n\nNeed help? Call or WhatsApp +91 7579189494.\n\n💬 Quick replies: \"Contact support\" | \"Return policy\" | \"Shop more\"";
  }

  if (m.includes("contact") || m.includes("support") || m.includes("phone") || m.includes("human")) {
    return "Reach us anytime:\n📧 namaste@naturaheal.in\n📱 +91 7579189494\n💬 WhatsApp: +91 7579189494\n⏰ Mon–Sat, 9AM–7PM IST 🌿\n\n💬 Quick replies: \"Delivery info\" | \"Return policy\" | \"Browse products\"";
  }

  // ── Greetings ──────────────────────────────────────────────
  if (m.length < 20 || m.includes("hi") || m.includes("hello") || m.includes("namaste") || m.includes("hey")) {
    const categories = [...new Set(inStock.map((p) => p.category))].slice(0, 4);
    const chips      = categories.map((c) => `"${c}"`).join(" | ");
    return `Namaste! 🙏 I'm Priya, your NaturaHeal wellness consultant.\n\nTell me what you're experiencing and I'll suggest the right remedy from our current catalog!\n\n💬 Quick replies: ${chips}`;
  }

  // ── Default — show current categories ─────────────────────
  const categories = [...new Set(inStock.map((p) => p.category))];
  const chips      = categories.slice(0, 4).map((c) => `"${c}"`).join(" | ");
  return `I'd love to help you find the right remedy! 🌿 We currently have products for:\n${categories.map((c) => `• ${c}`).join("\n")}\n\nWhat are you experiencing?\n\n💬 Quick replies: ${chips}`;
}
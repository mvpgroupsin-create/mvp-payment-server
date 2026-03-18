// ============================================
//  MVP AUTO PAYMENT SERVER — Razorpay
//  Real payment aaye → Key auto generate!
// ============================================
const express = require("express");
const crypto  = require("crypto");
const cors    = require("cors");
const app     = express();

app.use(cors());
app.use(express.static("public"));

// ⚠️ Webhook ke liye raw body chahiye — JSON se pehle
app.use("/api/razorpay-webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ══════════════════════════════════════════
//  ⚙️ CONFIG — Railway Variables se aayega
// ══════════════════════════════════════════
const CONFIG = {
  RZP_KEY_ID:     process.env.RZP_KEY_ID     || "rzp_test_SSUYtuGbhj4yU5",
  RZP_KEY_SECRET: process.env.RZP_KEY_SECRET || "55lDPolxRbcrBKqHr6PQPNf8",
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || "mvpwebhook123",  // Razorpay dashboard mein set karo
  BASE_URL:       process.env.BASE_URL        || "http://localhost:3000",
  TG_BOT_TOKEN:   process.env.TG_BOT_TOKEN   || "",
  TG_CHAT_ID:     process.env.TG_CHAT_ID     || "",
};

// In-memory DB
const orders   = {};  // orderId → order
const usedTxns = new Set();

// ─────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────

// Key Generate
function makeKey(days) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg   = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `NXT-${seg()}-${seg()}-${seg()}-${days}D`;
}

// Razorpay Order Create (HTTP se — no SDK needed)
async function createRazorpayOrder(amount, orderId) {
  const auth = Buffer.from(`${CONFIG.RZP_KEY_ID}:${CONFIG.RZP_KEY_SECRET}`).toString("base64");
  const res  = await fetch("https://api.razorpay.com/v1/orders", {
    method:  "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Basic ${auth}` },
    body: JSON.stringify({
      amount:   Math.round(amount * 100),  // paise mein
      currency: "INR",
      receipt:  orderId,
      notes:    { orderId },
    }),
  });
  return res.json();
}

// Telegram Notification
async function tgNotify(text) {
  if (!CONFIG.TG_BOT_TOKEN || !CONFIG.TG_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${CONFIG.TG_BOT_TOKEN}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ chat_id: CONFIG.TG_CHAT_ID, text, parse_mode: "Markdown" }),
    });
  } catch(e) { console.warn("TG failed:", e.message); }
}

// ─────────────────────────────────────────
//  ROUTES
// ─────────────────────────────────────────

// ✅ 1. Order Create
app.post("/api/create-order", async (req, res) => {
  const { amount, days, productType } = req.body;
  if (!amount || !days) return res.status(400).json({ error: "Amount aur days zaroori hain" });

  // Unique paise trick
  const paise      = Math.floor(Math.random() * 87) + 11;
  const exactAmt   = parseFloat((parseFloat(amount) + paise / 100).toFixed(2));
  const orderId    = "MVP_" + Date.now() + "_" + Math.floor(Math.random() * 9000 + 1000);

  // Razorpay order banao
  let rzpOrder;
  try {
    rzpOrder = await createRazorpayOrder(exactAmt, orderId);
    if (rzpOrder.error) throw new Error(rzpOrder.error.description);
  } catch(e) {
    console.error("Razorpay order error:", e.message);
    return res.status(500).json({ error: "Order create failed: " + e.message });
  }

  // Local mein save karo
  orders[orderId] = {
    orderId,
    rzpOrderId:  rzpOrder.id,
    days:        parseInt(days),
    productType: productType || "key",
    baseAmount:  parseFloat(amount),
    exactAmount: exactAmt,
    status:      "PENDING",
    createdAt:   Date.now(),
    expiresAt:   Date.now() + 15 * 60 * 1000,
  };

  res.json({
    success:     true,
    orderId,
    rzpOrderId:  rzpOrder.id,
    exactAmount: exactAmt,
    keyId:       CONFIG.RZP_KEY_ID,
  });
});

// ✅ 2. Razorpay Webhook — Real payment aane pe yahan aata hai
app.post("/api/razorpay-webhook", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const body      = req.body; // raw buffer

  // ✅ Webhook signature verify — FAKE payment block
  const expectedSig = crypto
    .createHmac("sha256", CONFIG.WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (signature !== expectedSig) {
    console.log("🚨 FAKE WEBHOOK! Signature mismatch.");
    return res.status(400).json({ error: "Invalid signature" });
  }

  const event   = JSON.parse(body.toString());
  const payload = event.payload?.payment?.entity;

  if (event.event === "payment.captured" && payload) {
    const rzpOrderId = payload.order_id;
    const paymentId  = payload.id;
    const paidAmount = payload.amount / 100; // paise → rupees

    // Order dhundo
    const order = Object.values(orders).find(o => o.rzpOrderId === rzpOrderId);
    if (!order) {
      console.log("❌ Order not found for rzpOrderId:", rzpOrderId);
      return res.json({ status: "ok" });
    }

    // ✅ Duplicate check
    if (usedTxns.has(paymentId)) {
      console.log("🚨 Duplicate payment:", paymentId);
      return res.json({ status: "ok" });
    }

    // ✅ Amount verify
    const diff = Math.abs(paidAmount - order.exactAmount);
    if (diff > 1.0) {
      console.log(`⚠️ Amount mismatch! Expected: ${order.exactAmount}, Got: ${paidAmount}`);
      order.status = "AMOUNT_MISMATCH";
      return res.json({ status: "ok" });
    }

    // 🎉 Payment Confirmed!
    usedTxns.add(paymentId);
    const key = makeKey(order.days);

    order.status    = "PAID";
    order.paymentId = paymentId;
    order.key       = key;
    order.paidAt    = Date.now();

    console.log(`✅ Payment confirmed! Order: ${order.orderId}, Key: ${key}`);

    // Telegram notify
    await tgNotify(
`✅ *New Payment!*
━━━━━━━━━━━━━━━
🔑 *Key:* \`${key}\`
📅 *Days:* ${order.days}
💵 *Amount:* ₹${paidAmount.toFixed(2)}
🧾 *Payment ID:* \`${paymentId}\`
🕐 ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
━━━━━━━━━━━━━━━`
    );
  }

  res.json({ status: "ok" });
});

// ✅ 3. Payment Verify — Frontend poll karta hai
app.post("/api/verify-payment", async (req, res) => {
  const { rzpPaymentId, rzpOrderId, rzpSignature, orderId } = req.body;

  // Signature verify (frontend se aata hai)
  const expectedSig = crypto
    .createHmac("sha256", CONFIG.RZP_KEY_SECRET)
    .update(`${rzpOrderId}|${rzpPaymentId}`)
    .digest("hex");

  if (rzpSignature !== expectedSig) {
    return res.json({ success: false, error: "Invalid signature — fake payment!" });
  }

  const order = orders[orderId];
  if (!order) return res.json({ success: false, error: "Order not found" });

  // ✅ Duplicate check
  if (usedTxns.has(rzpPaymentId)) {
    return res.json({ success: false, error: "Already used payment!" });
  }

  usedTxns.add(rzpPaymentId);
  const key = makeKey(order.days);

  order.status    = "PAID";
  order.paymentId = rzpPaymentId;
  order.key       = key;
  order.paidAt    = Date.now();

  await tgNotify(
`✅ *New Payment (Frontend Verify)*
━━━━━━━━━━━━━━━
🔑 *Key:* \`${key}\`
📅 *Days:* ${order.days}
💵 *Amount:* ₹${order.exactAmount.toFixed(2)}
🧾 *Payment ID:* \`${rzpPaymentId}\`
🕐 ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
━━━━━━━━━━━━━━━`
  );

  res.json({ success: true, key, days: order.days });
});

// ✅ 4. Order Status Check
app.get("/api/order-status/:orderId", (req, res) => {
  const order = orders[req.params.orderId];
  if (!order) return res.json({ error: "Order not found" });
  res.json({
    status:      order.status,
    exactAmount: order.exactAmount,
    key:         order.status === "PAID" ? order.key : null,
    days:        order.days,
    expiresAt:   order.expiresAt,
  });
});

// ✅ 5. Health Check
app.get("/", (req, res) => res.json({ status: "✅ MVP Server Running", time: new Date() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

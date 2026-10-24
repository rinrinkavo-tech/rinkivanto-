const http = require("http");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const WEBHOOK_SECRET = process.env.ZALO_OA_SECRET_KEY || "";
const APP_ID = process.env.ZALO_APP_ID || "";
// Paste the exact verification token shown by Zalo for the domain you are verifying.
const ZALO_VERIFY_TOKEN = process.env.ZALO_VERIFY_TOKEN || "";

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/\"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function send(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(body));
}

function safeEqualHex(a, b) {
  if (!/^[0-9a-f]+$/i.test(a || "") || !/^[0-9a-f]+$/i.test(b || "")) return false;
  const aa = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/") {
    // Zalo domain ownership verification meta tag. Keep this in the homepage <head>.
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store"
    });
    return res.end(`<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="zalo-platform-site-verification" content="S8wxCOMm4GXoeSCgigTC25IgtIYutOPrCZ8q" />
  <title>Zalo OA Webhook</title>
</head>
<body>
  <h1>Zalo OA webhook receiver</h1>
  <p>Service is running. Webhook endpoint: <code>/webhook</code></p>
  <p>Health check: <a href="/health">/health</a></p>
</body>
</html>`);
  }

  if (req.method === "GET" && url.pathname === "/health") {
    return send(res, 200, { ok: true });
  }

  if (req.method !== "POST" || url.pathname !== "/webhook") {
    return send(res, 404, { ok: false, error: "Not found" });
  }

  let raw = "";
  req.setEncoding("utf8");
  req.on("data", chunk => {
    raw += chunk;
    if (raw.length > 1024 * 1024) {
      send(res, 413, { ok: false, error: "Payload too large" });
      req.destroy();
    }
  });

  req.on("end", () => {
    let event;
    try {
      event = JSON.parse(raw || "{}");
    } catch (_) {
      return send(res, 400, { ok: false, error: "Invalid JSON" });
    }

    // Zalo webhook events may include X-ZEvent-Signature.
    // Do not silently claim a signature was verified if credentials are absent.
    const signatureHeader = req.headers["x-zevent-signature"];
    let signatureStatus = "not_checked";
    if (WEBHOOK_SECRET && APP_ID && signatureHeader) {
      try {
        const signatureObject = JSON.parse(signatureHeader);
        const supplied = signatureObject.mac || "";
        const timestamp = String(signatureObject.timeStamp || signatureObject.timestamp || "");
        const data = typeof event === "object" && event !== null ? JSON.stringify(event) : raw;
        // Signature formats vary by Zalo webhook specification/version.
        // Keep this marked unverified until configured against the exact official format.
        signatureStatus = "present_but_not_verified";
      } catch (_) {
        signatureStatus = "unrecognized_signature_header";
      }
    }

    // Minimal receiver: acknowledge the event and log only event metadata,
    // not access tokens or full message contents.
    console.log(JSON.stringify({
      receivedAt: new Date().toISOString(),
      event_name: event.event_name || "unknown",
      app_id: event.app_id || null,
      timestamp: event.timestamp || null,
      signatureStatus
    }));

    return send(res, 200, { ok: true, received: true });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
  

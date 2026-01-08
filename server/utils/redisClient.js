// server/utils/redisClient.js

const Redis = require("ioredis");

// ❌ Disable Redis completely when USE_REDIS=false
if (process.env.USE_REDIS === "false") {
  console.log("⚠️ Redis disabled. Using in-memory cache.");

  // Dummy in-memory functions (won’t crash anything)
  module.exports = {
    client: null,
    async setValue() {},
    async getValue() { return null },
    async deleteValue() {}
  };

  return; // ⛔ STOP HERE — do NOT create Redis connection
}

// -------------------------------------------
// ✅ Real Redis (Render / Local)
// -------------------------------------------

let client;

if (process.env.REDIS_URL) {
  client = new Redis(process.env.REDIS_URL, {
    tls: process.env.REDIS_URL.startsWith("rediss://") ? {} : undefined,
  });
} else {
  client = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  });
}

client.on("connect", () => console.log("✅ Connected to Redis"));
client.on("error", (err) => console.error("❌ Redis error:", err.message));

async function setValue(key, value, expireInSec = null) {
  if (expireInSec) return client.set(key, value, "EX", expireInSec);
  return client.set(key, value);
}

async function getValue(key) {
  return client.get(key);
}

async function deleteValue(key) {
  return client.del(key);
}

module.exports = { client, setValue, getValue, deleteValue };

import * as crypto from "crypto";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(path.resolve("apps/api/package.json"));
const bcrypt = require("bcrypt");

async function generateProductionEnv() {
  const jwtSecret = crypto.randomBytes(32).toString("hex");
  const adminJwtSecret = crypto.randomBytes(32).toString("hex");
  const randomPass = crypto.randomBytes(18).toString("base64url");
  const adminPasswordHash = bcrypt.hashSync(randomPass, 12);

  const envContent = `# ==============================================================================
# nanos.pk — Production Environment File for Hostinger Deployment
# File path: apps/api/.env.production.local
# ==============================================================================

# DATABASE_URL — paste production Neon connection string here
# DATABASE_URL="postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require"

NODE_ENV=production
WEB_ORIGIN=https://nanos.pk
ADMIN_ORIGIN=https://admin.nanos.pk

JWT_SECRET=${jwtSecret}
ADMIN_JWT_SECRET=${adminJwtSecret}

# ADMIN_EMAIL — paste production admin email here (e.g. saadahmad200555@gmail.com)
# ADMIN_EMAIL="saadahmad200555@gmail.com"

ADMIN_PASSWORD_HASH=${adminPasswordHash}

# RESEND_API_KEY — paste production Resend API key here
# RESEND_API_KEY="re_123456789"
RESEND_FROM_EMAIL=Nanos <orders@nanos.pk>
ORDER_CONFIRMATION_BASE_URL=https://nanos.pk

# META_PIXEL_ID — paste Meta Pixel ID here
# META_PIXEL_ID="1234567890"

# META_CONVERSIONS_API_TOKEN — paste Meta Conversions API access token here
# META_CONVERSIONS_API_TOKEN="EAAB..."

# POSTEX_API_TOKEN — paste PostEx API Token here
# POSTEX_API_TOKEN="ZWM5ODY3ZWQxMTA4NGYxYzljOWIzZjIzN2I2OTc4YTE6NzJkZWUxMmM4MzhlNGVhY2EzOGNmYzQ2NTk3NThjMWQ="
# POSTEX_BASE_URL="https://api.postex.pk"
`;

  const targetPath = path.resolve("apps/api/.env.production.local");
  fs.writeFileSync(targetPath, envContent, "utf8");

  console.log("SUCCESS: Created apps/api/.env.production.local cleanly.");
}

generateProductionEnv().catch((err) => {
  console.error("ERROR generating production env:", err.message);
  process.exit(1);
});

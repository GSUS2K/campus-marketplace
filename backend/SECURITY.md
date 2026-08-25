# Security Setup

Required before production use:

- Set a random `JWT_SECRET` of at least 32 characters in Render. Never use the repository fallback.
- Set `CORS_ORIGINS` to the exact frontend origin, without a wildcard.
- Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL` when a verified sender domain is available. Until then, `EMAIL_USER` and `EMAIL_PASS` provide the free Gmail fallback; signup and password reset fail closed until at least one provider is configured.
- Configure all three `TWILIO_*` variables before enabling phone verification. The API does not log or return mobile OTPs.
- Keep MongoDB network access restricted to the deployed backend where possible.
- Use Cloudinary, S3, or Supabase Storage for uploaded images. Render's local filesystem is not durable across redeploys.
- Keep `KAFKA_BROKER` empty unless a real broker is configured. MongoDB event logging works without Kafka.

Authentication now enforces `@lpu.in`, rate-limits auth and OTP endpoints, caps JSON request size, validates mobile numbers in E.164 format, and prevents duplicate listing checkout through temporary reservations.

## Release checklist

- Set `JWT_SECRET`, `MONGO_URI`, and `CORS_ORIGINS` before opening the site to users.
- Set `DEMO_SEED=false` after the demo data has been created and reviewed.
- Verify `/health` reports `"status":"OK"` after deployment; `DEGRADED` means the API is reachable but MongoDB is not connected.
- Test one buyer order through seller confirmation, shared handover code, completion, and buyer review.
- Test seller approval, listing approval, report resolution, and notification delivery with an admin account.
- Configure a durable image provider before accepting real listings; local `/uploads` files are only suitable for demos.

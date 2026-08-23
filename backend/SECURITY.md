# Security Setup

Required before production use:

- Set a random `JWT_SECRET` of at least 32 characters in Render. Never use the repository fallback.
- Set `CORS_ORIGINS` to the exact frontend origin, without a wildcard.
- Configure `EMAIL_USER` and `EMAIL_PASS`; signup and password reset fail closed until email delivery is available.
- Configure all three `TWILIO_*` variables before enabling phone verification. The API does not log or return mobile OTPs.
- Keep MongoDB network access restricted to the deployed backend where possible.
- Use Cloudinary, S3, or Supabase Storage for uploaded images. Render's local filesystem is not durable across redeploys.
- Keep `KAFKA_BROKER` empty unless a real broker is configured. MongoDB event logging works without Kafka.

Authentication now enforces `@lpu.in`, rate-limits auth and OTP endpoints, caps JSON request size, validates mobile numbers in E.164 format, and prevents duplicate listing checkout through temporary reservations.

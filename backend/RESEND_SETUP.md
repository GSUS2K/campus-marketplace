# Resend setup

The API prefers Resend for signup and password-reset OTPs, then automatically falls back to Gmail SMTP if Resend is unavailable or the Resend test sender cannot deliver to an LPU recipient.

## Render variables

Add these backend environment variables:

```text
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=Campus Marketplace <onboarding@resend.dev>
```

For production, verify a domain in Resend and replace `RESEND_FROM_EMAIL` with an address on that domain, for example `Campus Marketplace <no-reply@yourdomain.com>`.

Do not commit the API key. Keep `EMAIL_USER` and `EMAIL_PASS` configured as the free fallback until a verified Resend sender is available.

## Important free-plan behavior

Resend's onboarding sender is intended for testing and may only deliver to the email address associated with the Resend account. To send OTPs to all `@lpu.in` users, verify a domain you control first.

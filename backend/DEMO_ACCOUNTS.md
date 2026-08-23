# Demo Test Data

For Render free instances without Shell access, add `DEMO_SEED=true` in the service Environment settings and redeploy once. The server will seed automatically after MongoDB connects, then you can remove the variable and redeploy again. Locally, you can also run `npm run seed:demo` from `backend/` with `MONGO_URI` configured.

The seed refreshes only these demo accounts, their demo listings, and their demo orders. It does not clear real users or real listings.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@lpu.in` | `password123` |
| Seller | `seller@lpu.in` | `password123` |
| Seller | `ganesh.sivah2025@lpu.in` | `password123` |
| Buyer | `buyer@lpu.in` | `password123` |

The seed creates 30 image-backed sample listings and two buyer orders. Checkout uses a clearly labelled test payment flow; no real payment provider is connected.

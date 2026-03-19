# Glamora 🎬👗
### A platform where Fashion Creators Get Paid in Bitcoin & Stablecoins

Bringing liberation to fashion creators across Africa and beyond — building an atmosphere where talent thrives and creators receive exactly what they've earned, without bias or interference.

**Live Demo:** [glamora-gold.vercel.app](https://glamora-gold.vercel.app) | **Backend API:** [glamora-backend-rfnq.onrender.com](https://glamora-backend-rfnq.onrender.com)

---

## The Problem I'm Addressing

Fashion creators pour real work into their content — lookbooks, tutorials, behind-the-scenes shoots — and platforms take a significant cut before the money even reaches them. Add payment processor fees on top, wait weeks for a payout, and what was earned on paper rarely matches what lands in the creator's account.

For creators in Africa, this hits harder. Currency fluctuations during long payout windows eat into what's left. The system wasn't designed with them in mind.

---

## What Glamora Does Differently

Glamora is built on Stacks — Bitcoin's Layer 2 — using Clarity smart contracts. When a fan tips a creator, the money goes directly to the creator's wallet. Not to Glamora first. Not to a payment processor. Directly.

| Traditional Platforms | Glamora |
|---|---|
| Large platform cuts | 5% platform fee |
| Payment processor fees | None |
| Weeks of waiting for payouts | Instant |
| No currency stability options | USDCx stablecoin support |

---

## What's Actually Built and Working

This is not a whitepaper. Everything below is deployed and working on Stacks testnet.

### Smart Contracts (Clarity on Stacks)
- **`main-v13`** — Core platform: creator profiles, public user profiles, tipping, subscriptions, social follows
- **`storage-v4`** — On-chain data storage with role-based access control
- **`bridge-adapter`** — Vault system: accumulates small tips into batches so creators don't lose money to gas fees on every withdrawal
- **`glamora-nft-v6`** — Full NFT marketplace: SIP-009 compliant, mint collections, list/unlist, buy with sBTC
- **`sbtc-token`** — Mock sBTC for testnet
- **`usdcx-token`** — Mock USDCx for testnet

### Frontend (React + Vite)
- Wallet connection via Stacks Connect
- Creator and public user profile creation (stored on-chain)
- Fashion content publishing with IPFS image upload via Pinata
- USDCx tipping with live vault stats (balance display, $50 withdrawal threshold)
- NFT collection creation, minting, listing, buying
- x402 Pay-Per-View — fans pay $0.01 USDC to unlock exclusive creator content

### Backend (Node.js + Express on Render)
The backend is what powers the pay-per-view system. It has two content endpoints — one that's free and open to everyone, and one that's locked behind a payment. The locked endpoint doesn't serve anything until payment is confirmed. No tricks, no workarounds. It's a simple server doing one important job: making sure creators get paid before their content is shared.

---

## The x402 Feature — How It Works

Most content paywalls are built the wrong way. The content loads on the page, and a script hides it until you pay. Anyone who knows their way around a browser can get around that.

x402 works at a different level. When a fan tries to access premium content, the server holds everything back and asks for payment first. Only after the payment goes through does the content get sent. There is no version of the content sitting anywhere on the fan's screen before they pay.

For creators this means:
- Exclusive tutorials and behind-the-scenes content stay genuinely locked
- Payment is confirmed before anything is revealed
- No subscription management, no chargebacks — pay once, access once

Here's the flow:

```
Fan clicks "Unlock Premium Content"
→ Server receives the request
→ No payment detected → returns "Payment Required"
→ Fan pays $0.01 USDC
→ Payment confirmed → content delivered instantly
```

---

## Why Two Payment Options (sBTC + USDCx)?

**sBTC** is Bitcoin running on Stacks. For fans who want to support creators using Bitcoin — holding long-term value while spending it on content they love.

**USDCx** is a stablecoin on Stacks. Not everyone is into Bitcoin, and that's fine. USDCx lets fans and creators transact in a currency that holds its value day to day — no price swings, no surprises. For creators who want predictable income and for fans who prefer spending in something that feels closer to regular money, USDCx makes Glamora accessible beyond the crypto-native crowd.

Creators choose what they accept. Fans pay with what they have. The smart contract handles both.

---

## Vault System — Solving the Gas Fee Problem

Small tips create a real problem on blockchain: if a creator withdraws after every tip, gas fees can eat more than the tip itself.

The `bridge-adapter` vault holds tips until they reach a threshold (default: $50 in USDCx), then batches everything into one withdrawal. One gas fee covers the whole amount. Creators stop getting penalized for having fans who tip small but often.

---

## Technical Stack

| Layer | Technology |
|---|---|
| Blockchain | Stacks (Bitcoin L2) |
| Smart Contracts | Clarity |
| Frontend | React 19 + Vite |
| Wallet | Stacks Connect |
| File Storage | IPFS via Pinata |
| Micropayments | x402-express |
| Streaming Payments | Superfluid (USDCx) |
| Backend | Node.js + Express |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Run It Locally

### Smart Contracts
```bash
git clone https://github.com/Terese678/glamora.git
cd glamora
clarinet check    # Verify all contracts
clarinet test     # Run test suite
```

### Frontend
```bash
cd glamora-frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### Backend
```bash
git clone https://github.com/Terese678/glamora-backend.git
cd glamora-backend
npm install
node index.js
# Runs at http://localhost:3001
```

---

## Contract Addresses (Stacks Testnet)

| Contract | Address |
|---|---|
| main-v13 | `STPC6F6C2M7QAXPW66XW4Q0AGXX9HGAX6525RMF8.main-v13` |
| glamora-nft-v6 | `STPC6F6C2M7QAXPW66XW4Q0AGXX9HGAX6525RMF8.glamora-nft-v6` |
| storage-v4 | `STPC6F6C2M7QAXPW66XW4Q0AGXX9HGAX6525RMF8.storage-v4` |
| bridge-adapter | `STPC6F6C2M7QAXPW66XW4Q0AGXX9HGAX6525RMF8.bridge-adapter` |

---

## Why I Built This

I'm Timothy Terese Chimbiv. I run Dredge Classics, a fashion brand.

Building in the creator space means dealing with platforms that can ban your account without warning, cutting off your audience and your income in one move. I've been there. The lack of ownership over what you build is a real problem — not just a talking point.

Blockchain was supposed to fix this. Then gas fees made it worse — paying more to withdraw than you actually earned is not a solution, it's the same problem with a different name.

Glamora fixes both:
1. **5% platform fee** — not 50%
2. **Vault system** — gas fees stop punishing small creators
3. **Dual currency** — Bitcoin for believers, stablecoins for everyone else
4. **x402 pay-per-view** — payment confirmed at the server level, not hidden behind JavaScript

Fashion creators deserve infrastructure built for them, not infrastructure that extracts from them.

---

## What's Next

- [ ] Mainnet deployment (Stacks mainnet + real sBTC)
- [ ] Mobile app
- [ ] Creator analytics dashboard
- [ ] xReserve bridge integration
- [ ] Subscription streaming via Superfluid

---

*Glamora Built on Stacks with Clarity*
*GitHub: github.com/Terese678/glamora*
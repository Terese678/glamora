# Glamora - Fashion Creators Getting Paid in Bitcoin & Stablecoins

**Direct payments. No middlemen taking 50% cuts.**

As CEO of Dredge Classics, a fashion brand, I've watched platforms slash creator earnings with 20-80% fees and payment delays that stretch for weeks. I built Glamora on Stacks (Bitcoin Layer 2) so fashion creators can showcase their work, mint NFTs, and get paid directly in Bitcoin (sBTC) or USD stablecoins (USDCx). This solves the problem of lack of total control and ownership of product, plus the issue of platform charges. Here in Glamora, creators keep 95%, and only 5% goes to the platform. Payments are instant, and there's no platform holding your money hostage.

---

## The Problem

Traditional platforms take 30-50% of creator earnings. Payment processors add another 3-5%. Then you wait 2-4 weeks for payouts. By the time you get paid, currency fluctuations can eat another 10-20% if you're in Nigeria.

**Fashion is an integral part of human existence, but creators are getting robbed.**

---

## The Solution

Glamora runs on smart contracts on Stacks (Bitcoin's Layer 2):

- **Direct tipping** in sBTC or USDCx
- **5% platform fee** (we keep the lights on, you keep your money)
- **Instant payments** (no waiting weeks)
- **Vault system** accumulates small tips to save on gas fees
- **NFT marketplace** for fashion collections
- **Monthly subscriptions** for fan support

With Glamora, tips go straight to creators. No delays, no deductions, no currency crashes eating your rent money.

---

## Why Dual Payments (sBTC + USDCx)?

**sBTC (Bitcoin on Stacks)**  
For fans who want to support creators with Bitcoin. Long-term value.

**USDCx (USDC on Stacks)**  
For creators who need stable income TODAY. No volatility anxiety when rent is due.

Creators choose what they accept. Fans pay with what they have.

---

## Technical Architecture

Built on **Stacks** (Bitcoin Layer 2) using **Clarity** smart contracts:

- **`main.clar`** - Core platform (profiles, tips, subscriptions, follows)
- **`storage-v2.clar`** - Secure data storage with role-based access
- **`bridge-adapter.clar`** - Vault system (accumulates tips, optimizes withdrawals)
- **`glamora-nft.clar`** - NFT creation and marketplace (SIP-009 compliant)
- **`sbtc-token.clar`** - Mock sBTC for testing
- **`usdcx-token.clar`** - Mock USDCx for testing
- **`sip-009.clar`** - NFT standard trait

---

## Current Status

**Smart Contracts:** ✅ Deployed on Stacks testnet  
**Web UI:** ⏳ In development  

**Working Features (Smart Contracts):**
- Dual payment system (sBTC + USDCx)
- Creator and fan profiles
- Tipping with vault accumulation
- Monthly subscriptions
- NFT minting and marketplace
- Social following system

**Planned Features:**
- Web interface
- IPFS content storage
- Mobile app
- Creator analytics
- xReserve bridge integration (when mainnet launches)

---

## Run It Locally

```bash
git clone https://github.com/Terese678/glamora.git
cd glamora
clarinet check    # Verify contracts
clarinet test     # Run tests
```

---

## Why I Built This

I'm Timothy Terese Chimbiv.

I've seen too many talented fashion creators quit because platforms take 50% of their earnings, payment processors take another 5%, and by the time the money arrives weeks later, currency volatility has eaten what's left.

Blockchain was supposed to fix this. But high gas fees made it worse for small creators—they'd pay $5 in fees to withdraw $3 in tips.

Glamora fixes both problems:
1. **5% platform fee** (not 50%)
2. **Vault system** accumulates tips to minimize gas fees
3. **Dual payment options** (Bitcoin believers + stablecoin pragmatists)

Fashion creators deserve better. This is better.

---

**Hackathon:** Programming USDCx on Stacks Builder Challenge (Jan 19-25, 2026)  
**Version:** 3.0  
**GitHub:** [github.com/Terese678/glamora](https://github.com/Terese678)


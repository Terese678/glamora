# Glamora - Fashion creators getting paid in Bitcoin

**Fashion creators getting paid in Bitcoin. That's it.**

I built this because fashion creators deserve better than platforms taking 30-50% cuts and holding their money for weeks. With Glamora, creators post their work, fans tip them Bitcoin (through sBTC), and creators keep 95%. Money moves instantly.

## What This Actually Does

**For Fashion Creators:**
- Post your runway shows, lookbooks, styling tutorials, whatever
- People tip you in Bitcoin
- You get 95%, I take 5% to keep the platform running
- Fans can subscribe monthly to support you
- You can create and sell NFT collections of your work

**For Fashion Fans:**
- Follow creators you like
- Tip them when they post something nice
- Subscribe if you're a real fan
- Collect their NFTs

## The Money Part

Everything runs on sBTC (Bitcoin on Stacks). Why sBTC? It's Bitcoin-backed, not just another platform token.

- **Tips**: Start at 0.001 sBTC 
- **Subscriptions**: Basic => 0.02 sBTC, Premium => 0.05 sBTC, and VIP => 0.06 sBTC monthly
- **NFT Collections**: 0.05 sBTC to create 
- **Platform fee**: 5% keeps the platform running

## The Tech

Built on Stacks (Bitcoin layer) using Clarity smart contracts:

- **main.clar** - Core logic (profiles, tips, subscriptions, follows)
- **storage.clar** - Secure database with authorization controls
- **glamora-nft.clar** - NFT functionality (SIP-009 compliant)
- **sip-009.clar** - NFT standard trait
- **sbtc-token.clar** - Mock Bitcoin for local testing

The content lives on IPFS for true decentralized storage.

## Running It Locally
```bash
git clone https://github.com/Terese678/glamora.git
cd glamora
clarinet check    # Make sure nothing's broken
clarinet test     # Run the tests
```
If clarinet check passes, then it's fine

## Current Features

- Creator and public user profiles  
- Content publishing across 5 fashion categories  
- Bitcoin tipping system  
- Monthly subscriptions  
- NFT collection creation and minting  
- Social following system  
- IPFS content storage  
- NFT marketplace (list/buy/sell)  

## What's Next

- Better discovery and search
- Mobile-optimized interface
- Creator analytics dashboard
- Enhanced NFT features

## Why I Built This

I'm Timothy. I write Clarity contracts. I saw fashion creators getting exploited by web2 platforms and thought blockchain could actually solve this one. Direct payments between creators and fans, that's what crypto should enable.

Built by Timothy Terese Chimbiv  
Version 3.0  
https://github.com/Terese678 | Questions? 

// Contract Configuration
// This file stores all the important addresses and settings for your smart contract

// Network configuration - which blockchain network to use
export const NETWORK_CONFIG = {
  url: 'https://api.testnet.hiro.so', // Stacks testnet API
  name: 'testnet'
};

// Your smart contract details
export const CONTRACT_CONFIG = {
  address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Replace with your contract address
  name: 'glamora-marketplace' // Replace with your contract name
};

// All contracts - for easy reference
export const CONTRACTS = {
  GLAMORA_MARKETPLACE: 'glamora-marketplace'
};

// Contract function names 
export const CONTRACT_FUNCTIONS = {
  // Product functions
  LIST_PRODUCT: 'list-product',
  BUY_PRODUCT: 'buy-product',
  GET_PRODUCT: 'get-product',
  
  // User functions
  REGISTER_USER: 'register-user',
  GET_USER: 'get-user',
  
  // Review functions
  ADD_REVIEW: 'add-review',
  GET_REVIEWS: 'get-reviews'
};

// Main contract functions - same as CONTRACT_FUNCTIONS for compatibility
export const MAIN_FUNCTIONS = CONTRACT_FUNCTIONS;

// NFT-related functions
export const NFT_FUNCTIONS = {
  MINT_NFT: 'mint-nft',
  TRANSFER_NFT: 'transfer-nft',
  GET_NFT_OWNER: 'get-nft-owner',
  GET_NFT_URI: 'get-nft-uri'
};

// Subscription tiers for Glamora platform
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise'
};

// Content categories for fashion items
export const CONTENT_CATEGORIES = [
  'Dresses',
  'Tops',
  'Bottoms',
  'Outerwear',
  'Shoes',
  'Accessories',
  'Jewelry',
  'Bags',
  'Activewear',
  'Swimwear'
];

// Minimum tip amount in microSTX (1 STX = 1,000,000 microSTX)
export const MIN_TIP_AMOUNT = 1000000; // 1 STX minimum


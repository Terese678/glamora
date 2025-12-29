// Contract Configuration for Glamora NFT Marketplace
// I deployed on Stacks Testnet through Leather Wallet

// Network configuration - Stacks testnet
export const NETWORK_CONFIG = {
  url: 'https://api.testnet.hiro.so',
  name: 'testnet'
};

// Deployer address 
export const DEPLOYER_ADDRESS = 'STPC6F6C2M7QAXPW66XW4Q0AGXX9HGAX6525RMF8';

// Main contract configuration
export const CONTRACT_CONFIG = {
  address: DEPLOYER_ADDRESS,
  name: 'main-v4'  
};

// All deployed contracts with full addresses
export const CONTRACTS = {
  // Main marketplace contract 
  MAIN: `${DEPLOYER_ADDRESS}.main-v4`,  
  
  // NFT contract - NOT DEPLOYED YET (Phase 2)
  // NFT: `${DEPLOYER_ADDRESS}.glamora-nft`,
  
  // Storage contract for data management
  STORAGE: `${DEPLOYER_ADDRESS}.storage`,
  
  // SIP-009 trait definition
  SIP_009: `${DEPLOYER_ADDRESS}.sip-009`,
  
  // sBTC token for payments
  SBTC_TOKEN: `${DEPLOYER_ADDRESS}.sbtc-token`
};

// Contract function names for main marketplace
export const CONTRACT_FUNCTIONS = {
  // Creator profile functions
  CREATE_CREATOR_PROFILE: 'create-creator-profile',
  GET_CREATOR_PROFILE: 'get-creator-profile',
  UPDATE_CREATOR_PROFILE: 'update-creator-profile',  
  
  // Public user functions
  CREATE_PUBLIC_USER_PROFILE: 'create-public-user-profile',
  GET_PUBLIC_USER_PROFILE: 'get-public-user-profile',
  UPDATE_PUBLIC_USER_PROFILE: 'update-public-user-profile',  
  
  // Content functions
  PUBLISH_CONTENT: 'publish-content',
  GET_CONTENT_DETAILS: 'get-content-details',
  GET_NEXT_CONTENT_ID: 'get-next-content-id',
  
  // Social functions
  FOLLOW_USER: 'follow-user',
  UNFOLLOW_USER: 'unfollow-user',
  IS_USER_FOLLOWING: 'is-user-following',
  GET_TOTAL_FOLLOWERS: 'get-total-followers',
  
  // Tipping functions
  TIP_CREATOR: 'tip-creator',
  GET_TIP_DETAILS: 'get-tip-details',
  GET_TOTAL_TIPS: 'get-total-tips',
  
  // Subscription functions
  SUBSCRIBE_TO_CREATOR: 'subscribe-to-creator',
  CANCEL_SUBSCRIPTION: 'cancel-subscription',
  HAS_ACTIVE_SUBSCRIPTION: 'has-active-subscription',
  GET_USER_SUBSCRIPTION: 'get-user-subscription',
  
  // Platform stats (read-only)
  GET_PLATFORM_STATS: 'get-platform-stats',
  GET_TOTAL_USERS: 'get-total-users',
  GET_TOTAL_CONTENT: 'get-total-content'
};

// Main contract functions - same as CONTRACT_FUNCTIONS for compatibility
export const MAIN_FUNCTIONS = CONTRACT_FUNCTIONS;

// NFT-related functions (glamora-nft contract) - PHASE 2
export const NFT_FUNCTIONS = {
  // Commented out until glamora-nft is fixed and deployed
  // MINT_NFT: 'mint',
  // TRANSFER_NFT: 'transfer',
  // GET_NFT_OWNER: 'get-owner',
  // GET_NFT_URI: 'get-token-uri',
  // GET_LAST_TOKEN_ID: 'get-last-token-id'
};

// sBTC token functions (for payments)
export const SBTC_FUNCTIONS = {
  TRANSFER: 'transfer',
  GET_BALANCE: 'get-balance',
  MINT: 'mint' // Only available in testnet for testing
};

// Subscription tiers for Glamora platform
export const SUBSCRIPTION_TIERS = {
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
  ENTERPRISE: 3
};

// Content categories for fashion items
export const CONTENT_CATEGORIES = {
  CLOTHING: 1,
  ACCESSORIES: 2,
  FOOTWEAR: 3,
  JEWELRY: 4,
  BAGS: 5,
  OTHER: 6
};

// Minimum tip amount in sBTC satoshis (1 sBTC = 100,000,000 satoshis)
export const MIN_TIP_AMOUNT = 1000000; // 0.01 sBTC minimum

// For sBTC: 1 sBTC = 100,000,000 satoshis (8 decimals)
export const SBTC_DECIMALS = 8;
export const MIN_SBTC_AMOUNT = 100000; // 0.001 sBTC minimum

// Testnet explorer base URL
export const EXPLORER_URL = 'https://explorer.hiro.so';

// Helper function to get contract explorer URL
export const getContractExplorerUrl = (contractName) => {
  return `${EXPLORER_URL}/txid/${DEPLOYER_ADDRESS}.${contractName}?chain=testnet`;
};

// Helper function to get transaction explorer URL
export const getTxExplorerUrl = (txId) => {
  return `${EXPLORER_URL}/txid/${txId}?chain=testnet`;
};

// Helper function to get address explorer URL
export const getAddressExplorerUrl = (address) => {
  return `${EXPLORER_URL}/address/${address}?chain=testnet`;
};
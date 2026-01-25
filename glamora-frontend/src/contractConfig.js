// Contract Configuration for Glamora 
// Updated for USDCx Integration and Bridge-Adapter

// Network configuration - Stacks testnet
export const NETWORK_CONFIG = {
  url: 'https://api.testnet.hiro.so',
  name: 'testnet'
};

// Your deployer address (all contracts deployed here)
export const DEPLOYER_ADDRESS = 'STPC6F6C2M7QAXPW66XW4Q0AGXX9HGAX6525RMF8';

// Main contract configuration (your primary smart contract)
export const CONTRACT_CONFIG = {
  address: DEPLOYER_ADDRESS,
  name: 'main-v7'  // Updated to v7
};

// All deployed contracts with full addresses
export const CONTRACTS = {
  // Main marketplace contract 
  MAIN: {
    address: DEPLOYER_ADDRESS,
    name: 'main-v7'
  },
  
  // Storage contract for data management
  STORAGE: {
    address: DEPLOYER_ADDRESS,
    name: 'storage-v3'
  },
  
  // Bridge adapter for USDCx batching (YOUR INNOVATION!)
  BRIDGE_ADAPTER: {
    address: DEPLOYER_ADDRESS,
    name: 'bridge-adapter'
  },
  
  // USDCx token contract (REQUIRED FOR COMPETITION)
  USDCX_TOKEN: {
    address: DEPLOYER_ADDRESS,
    name: 'usdcx-token'
  },
  
  // sBTC token for payments
  SBTC_TOKEN: {
    address: DEPLOYER_ADDRESS,
    name: 'sbtc-token'
  },
  
  // NFT contract
  NFT: {
    address: DEPLOYER_ADDRESS,
    name: 'glamora-nft-v2'
  },
  
  // SIP-009 trait definition
  SIP_009: {
    address: DEPLOYER_ADDRESS,
    name: 'sip-009'
  }
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
  
  // Tipping functions (STX)
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

// Bridge Adapter Functions (YOUR INNOVATION!)
export const BRIDGE_FUNCTIONS = {
  INITIALIZE_VAULT: 'initialize-vault',
  GET_VAULT_INFO: 'get-vault-info',
  GET_BATCH_STATS: 'get-batch-stats',
  DEPOSIT_TO_VAULT: 'deposit-to-vault',
  WITHDRAW_FROM_VAULT: 'withdraw-from-vault',
  PROCESS_BATCH: 'process-batch'
};

// USDCx Token Functions (REQUIRED FOR COMPETITION)
export const USDCX_FUNCTIONS = {
  TRANSFER: 'transfer',
  GET_BALANCE: 'get-balance',
  GET_NAME: 'get-name',
  GET_SYMBOL: 'get-symbol',
  GET_DECIMALS: 'get-decimals',
  GET_TOTAL_SUPPLY: 'get-total-supply'
};

// sBTC token functions (for payments)
export const SBTC_FUNCTIONS = {
  TRANSFER: 'transfer',
  GET_BALANCE: 'get-balance',
  MINT: 'mint' // Only available in testnet for testing
};

// NFT-related functions (glamora-nft contract)
export const NFT_FUNCTIONS = {
  MINT_NFT: 'mint-fashion-nft',
  TRANSFER_NFT: 'transfer',
  GET_NFT_OWNER: 'get-owner',
  GET_NFT_URI: 'get-token-uri',
  GET_LAST_TOKEN_ID: 'get-last-token-id',
  CREATE_COLLECTION: 'create-nft-collection',
  LIST_NFT: 'list-fashion-nft',
  UNLIST_NFT: 'unlist-fashion-nft',
  PURCHASE_NFT: 'purchase-fashion-nft',
  GET_NFT_LISTING: 'get-nft-listing'
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

// Token decimals
export const SBTC_DECIMALS = 8;
export const USDCX_DECIMALS = 6; // USDCx uses 6 decimals like standard USDC

// Minimum tip amounts
export const MIN_TIP_AMOUNT = 1000000; // 0.01 sBTC minimum for STX tips
export const MIN_USDCX_TIP = 100000; // 0.1 USDCx in micro-units

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

// Helper function to format USDCx amount (from micro-units to display)
export const formatUSDCxAmount = (microAmount) => {
  return (microAmount / 1000000).toFixed(2);
};

// Helper function to convert display amount to micro-units
export const toMicroUSDCx = (displayAmount) => {
  return Math.floor(displayAmount * 1000000);
};
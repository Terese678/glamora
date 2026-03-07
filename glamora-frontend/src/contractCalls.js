// Contract Calls for Glamora
// All functions here call your deployed Clarity smart contracts on Stacks testnet

import {
  CONTRACT_CONFIG,
  CONTRACTS,
  MAIN_FUNCTIONS,
  NFT_FUNCTIONS,
  CONTENT_CATEGORIES,
  SUBSCRIPTION_TIERS,
  MIN_TIP_AMOUNT,
  USDCX_FUNCTIONS,
  BRIDGE_FUNCTIONS,
} from './contractConfig';

import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringAsciiCV,
  principalCV,
  boolCV,
  noneCV,
  someCV,
  bufferCVFromString,
} from '@stacks/transactions';

import { StacksTestnet } from '@stacks/network';
import { openContractCall } from '@stacks/connect';
import { fetchCallReadOnlyFunction, cvToValue, Cl } from '@stacks/transactions';

const network = new StacksTestnet();

// ============================================================
// HELPER: Read-only contract call (no wallet needed)
// ============================================================
async function readOnly(contractName, functionName, args = []) {
  const result = await fetchCallReadOnlyFunction({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName,
    functionName,
    functionArgs: args,
    network,
    senderAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
  });
  return cvToValue(result);
}

// ============================================================
// CREATOR PROFILE FUNCTIONS
// Contract: main-v7
// ============================================================

// Register a new creator profile on chain
export const createCreatorProfile = async (
  username,
  bio,
  profileImageUrl,
  category,
  userSession
) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN,         // main-v7
    functionName: MAIN_FUNCTIONS.CREATE_CREATOR_PROFILE,
    functionArgs: [
      stringAsciiCV(username),
      stringAsciiCV(bio),
      stringAsciiCV(profileImageUrl),
      stringAsciiCV(category),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ Creator profile created:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ Creator profile creation cancelled');
    },
  };
  await openContractCall(options);
};

// Register a new public (fan) user profile on chain
export const createPublicUserProfile = async (
  username,
  bio,
  profileImageUrl,
  userSession
) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN,         // main-v7
    functionName: MAIN_FUNCTIONS.CREATE_PUBLIC_USER_PROFILE,
    functionArgs: [
      stringAsciiCV(username),
      stringAsciiCV(bio),
      stringAsciiCV(profileImageUrl),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ Public user profile created:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ Public user profile creation cancelled');
    },
  };
  await openContractCall(options);
};

// Update an existing creator profile
export const updateCreatorProfile = async (
  username,
  bio,
  profileImageUrl,
  category,
  userSession
) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN,         // main-v7
    functionName: MAIN_FUNCTIONS.UPDATE_CREATOR_PROFILE,
    functionArgs: [
      stringAsciiCV(username),
      stringAsciiCV(bio),
      stringAsciiCV(profileImageUrl),
      stringAsciiCV(category),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ Creator profile updated:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ Creator profile update cancelled');
    },
  };
  await openContractCall(options);
};

// Update an existing public user profile
export const updatePublicUserProfile = async (
  username,
  bio,
  profileImageUrl,
  userSession
) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN,         // main-v7
    functionName: MAIN_FUNCTIONS.UPDATE_PUBLIC_USER_PROFILE,
    functionArgs: [
      stringAsciiCV(username),
      stringAsciiCV(bio),
      stringAsciiCV(profileImageUrl),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ Public user profile updated:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ Public user profile update cancelled');
    },
  };
  await openContractCall(options);
};

// Read a creator profile from chain (no wallet needed)
export const getCreatorProfile = async (creatorAddress) => {
  return await readOnly(
    CONTRACTS.MAIN,                       // main-v7
    MAIN_FUNCTIONS.GET_CREATOR_PROFILE,
    [principalCV(creatorAddress)]
  );
};

// Read a public user profile from chain (no wallet needed)
export const getPublicUserProfile = async (userAddress) => {
  return await readOnly(
    CONTRACTS.MAIN,                       // main-v7
    MAIN_FUNCTIONS.GET_PUBLIC_USER_PROFILE,
    [principalCV(userAddress)]
  );
};

// ============================================================
// CONTENT FUNCTIONS
// Contract: main-v7
// ============================================================

// Publish a new content post (fashion content, tips, etc.)
export const createContent = async (
  title,
  description,
  contentUrl,
  category,
  isPremium,
  userSession
) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN,         // main-v7
    functionName: MAIN_FUNCTIONS.CREATE_CONTENT,
    functionArgs: [
      stringAsciiCV(title),
      stringAsciiCV(description),
      stringAsciiCV(contentUrl),
      stringAsciiCV(category),
      boolCV(isPremium),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ Content created:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ Content creation cancelled');
    },
  };
  await openContractCall(options);
};

// Read a single content post (no wallet needed)
export const getContent = async (contentId) => {
  return await readOnly(
    CONTRACTS.MAIN,                       // main-v7
    MAIN_FUNCTIONS.GET_CONTENT,
    [uintCV(contentId)]
  );
};

// ============================================================
// TIPPING FUNCTIONS
// Contract: main-v7
// Fans tip creators with sBTC or USDCx
// USDCx tips go into the creator's vault (saves gas fees)
// sBTC tips go directly to the creator's wallet
// ============================================================

// Send a tip to a creator
export const tipCreator = async (
  creatorAddress,
  amount,
  paymentToken,   // 'sbtc' or 'usdcx'
  userSession
) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN,         // main-v7
    functionName: MAIN_FUNCTIONS.TIP_CREATOR,
    functionArgs: [
      principalCV(creatorAddress),
      uintCV(amount),
      stringAsciiCV(paymentToken),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ Tip sent:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ Tip cancelled');
    },
  };
  await openContractCall(options);
};

// ============================================================
// FOLLOW FUNCTIONS
// Contract: main-v7
// ============================================================

// Follow a creator
export const followUser = async (creatorAddress, userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN,         // main-v7
    functionName: MAIN_FUNCTIONS.FOLLOW_USER,
    functionArgs: [principalCV(creatorAddress)],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ Followed creator:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ Follow cancelled');
    },
  };
  await openContractCall(options);
};

// Unfollow a creator
export const unfollowUser = async (creatorAddress, userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN,         // main-v7
    functionName: MAIN_FUNCTIONS.UNFOLLOW_USER,
    functionArgs: [principalCV(creatorAddress)],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ Unfollowed creator:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ Unfollow cancelled');
    },
  };
  await openContractCall(options);
};

// ============================================================
// SUBSCRIPTION FUNCTIONS
// Contract: main-v7
// Subscriptions use stacks-block-time for accurate 30-day windows
// ============================================================

// Subscribe to a creator (Basic, Premium, or VIP tier)
export const subscribeToCreator = async (
  creatorAddress,
  tier,             // 'basic', 'premium', or 'vip'
  paymentToken,     // 'sbtc' or 'usdcx'
  userSession
) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN,         // main-v7
    functionName: MAIN_FUNCTIONS.SUBSCRIBE_TO_CREATOR,
    functionArgs: [
      principalCV(creatorAddress),
      stringAsciiCV(tier),
      stringAsciiCV(paymentToken),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ Subscribed to creator:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ Subscription cancelled');
    },
  };
  await openContractCall(options);
};

// Cancel an active subscription
export const cancelSubscription = async (creatorAddress, userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN,         // main-v7
    functionName: MAIN_FUNCTIONS.CANCEL_SUBSCRIPTION,
    functionArgs: [principalCV(creatorAddress)],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ Subscription cancelled:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ Cancel subscription aborted');
    },
  };
  await openContractCall(options);
};

// Check if a user has an active subscription to a creator
export const getUserSubscription = async (userAddress, creatorAddress) => {
  return await readOnly(
    CONTRACTS.MAIN,                       // main-v7
    MAIN_FUNCTIONS.GET_USER_SUBSCRIPTION,
    [principalCV(userAddress), principalCV(creatorAddress)]
  );
};

// ============================================================
// NFT FUNCTIONS
// Contract: glamora-nft-v2
// Fashion NFTs with permanent 8% creator royalty on every resale
// Royalty is enforced at contract level - no marketplace can bypass it
// ============================================================

// Mint a new fashion NFT
// Creator address is stored at mint time for permanent royalty tracking
export const mintFashionNFT = async (
  metadataUrl,
  name,
  description,
  userSession
) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.NFT,          // glamora-nft-v2
    functionName: NFT_FUNCTIONS.MINT,
    functionArgs: [
      stringAsciiCV(metadataUrl),
      stringAsciiCV(name),
      stringAsciiCV(description),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ NFT minted:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ NFT mint cancelled');
    },
  };
  await openContractCall(options);
};

// List an NFT for sale on the marketplace
export const listNFTForSale = async (tokenId, price, paymentToken, userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.NFT,          // glamora-nft-v2
    functionName: NFT_FUNCTIONS.LIST_NFT, // list-nft-for-sale
    functionArgs: [
      uintCV(tokenId),
      uintCV(price),
      stringAsciiCV(paymentToken),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ NFT listed for sale:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ NFT listing cancelled');
    },
  };
  await openContractCall(options);
};

// Buy an NFT from the marketplace
// Payment splits: 87% seller, 8% original creator royalty, 5% platform
// Royalty goes to the creator who originally minted this NFT - forever
export const buyNFT = async (tokenId, userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN,         // main-v7 handles buy-nft with royalty split
    functionName: NFT_FUNCTIONS.BUY_NFT,  // buy-nft
    functionArgs: [uintCV(tokenId)],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ NFT purchased:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ NFT purchase cancelled');
    },
  };
  await openContractCall(options);
};

// Remove an NFT listing from the marketplace
export const cancelNFTListing = async (tokenId, userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.NFT,          // glamora-nft-v2
    functionName: NFT_FUNCTIONS.CANCEL_LISTING, // cancel-nft-listing
    functionArgs: [uintCV(tokenId)],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ NFT listing cancelled:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ Cancel listing aborted');
    },
  };
  await openContractCall(options);
};

// Read NFT details (no wallet needed)
export const getNFT = async (tokenId) => {
  return await readOnly(
    CONTRACTS.NFT,                        // glamora-nft-v2
    NFT_FUNCTIONS.GET_NFT,
    [uintCV(tokenId)]
  );
};

// Read NFT listing details (no wallet needed)
export const getNFTListing = async (tokenId) => {
  return await readOnly(
    CONTRACTS.NFT,                        // glamora-nft-v2
    NFT_FUNCTIONS.GET_LISTING,
    [uintCV(tokenId)]
  );
};

// ============================================================
// VAULT FUNCTIONS
// Contract: bridge-adapter
// The vault holds USDCx earnings until the creator hits their
// withdrawal threshold - one withdrawal, one gas fee.
// This is how a creator in Lagos keeps $55 instead of losing $40.
// ============================================================

// Read a creator's vault balance and threshold info (no wallet needed)
export const getCreatorVaultInfo = async (creatorAddress) => {
  return await readOnly(
    CONTRACTS.BRIDGE_ADAPTER,             // bridge-adapter
    BRIDGE_FUNCTIONS.GET_VAULT_INFO,      // get-creator-vault-info
    [principalCV(creatorAddress)]
  );
};

// Set the USDCx amount threshold before vault auto-withdraws
export const setVaultThreshold = async (threshold, userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.BRIDGE_ADAPTER, // bridge-adapter
    functionName: BRIDGE_FUNCTIONS.SET_THRESHOLD,
    functionArgs: [uintCV(threshold)],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ Vault threshold set:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ Set threshold cancelled');
    },
  };
  await openContractCall(options);
};

// Manually withdraw USDCx earnings from the vault to creator's wallet
export const withdrawFromVault = async (userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.BRIDGE_ADAPTER, // bridge-adapter
    functionName: BRIDGE_FUNCTIONS.WITHDRAW,
    functionArgs: [],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ Vault withdrawal complete:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ Vault withdrawal cancelled');
    },
  };
  await openContractCall(options);
};

// ============================================================
// USDCX TOKEN FUNCTIONS
// Contract: usdcx-token
// Mock sBTC and USDCx tokens for testnet testing
// ============================================================

// Mint test USDCx tokens (testnet only - for demo purposes)
export const mintTestUSDCx = async (amount, recipient, userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.USDCX,        // usdcx-token
    functionName: USDCX_FUNCTIONS.MINT,
    functionArgs: [uintCV(amount), principalCV(recipient)],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
    onFinish: (data) => {
      console.log('✅ Test USDCx minted:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ Mint cancelled');
    },
  };
  await openContractCall(options);
};

// Check USDCx balance of any address (no wallet needed)
export const getUSDCxBalance = async (address) => {
  return await readOnly(
    CONTRACTS.USDCX,                      // usdcx-token
    USDCX_FUNCTIONS.GET_BALANCE,
    [principalCV(address)]
  );
};

// ============================================================
// PLATFORM STATS
// Contract: main-v7
// Read-only stats for the Glamora platform dashboard
// ============================================================

// Get overall platform statistics (no wallet needed)
export const getPlatformStats = async () => {
  return await readOnly(
    CONTRACTS.MAIN,                       // main-v7
    MAIN_FUNCTIONS.GET_PLATFORM_STATS,
    []
  );
};

// Get NFT marketplace statistics (no wallet needed)
export const getNFTMarketplaceStats = async () => {
  return await readOnly(
    CONTRACTS.MAIN,                       // main-v7
    MAIN_FUNCTIONS.GET_NFT_MARKETPLACE_STATS,
    []
  );
};
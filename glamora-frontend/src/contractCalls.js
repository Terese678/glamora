// Contract Calls for Glamora
// All functions here call deployed Clarity smart contracts on Stacks testnet

import {
  CONTRACT_CONFIG,
  CONTRACTS,
  MAIN_FUNCTIONS,
  NFT_FUNCTIONS,
  USDCX_FUNCTIONS,
  BRIDGE_FUNCTIONS,
} from './contractConfig';

import {
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringAsciiCV,
  stringUtf8CV,
  principalCV,
  noneCV,
  someCV,
  bufferCVFromString,
} from '@stacks/transactions';

import { openContractCall } from '@stacks/connect';
import { cvToValue } from '@stacks/transactions';

const network = 'testnet';

// ============================================================
// HELPER: Read-only contract call via Hiro REST API
// ============================================================
async function readOnly(contractName, functionName, args = []) {
  const { serializeCV } = await import('@stacks/transactions');
  const serializedArgs = args.map(arg => {
    const bytes = serializeCV(arg);
    return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  });

  const url = `https://api.testnet.hiro.so/v2/contracts/call-read/${CONTRACT_CONFIG.DEPLOYER_ADDRESS}/${contractName}/${functionName}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
      arguments: serializedArgs,
    }),
  });

  const data = await response.json();
  
  if (!data.okay) {
    throw new Error(`Contract call failed: ${data.cause || JSON.stringify(data)}`);
  }

  const { deserializeCV } = await import('@stacks/transactions');
  const resultCV = deserializeCV(data.result);
  return cvToValue(resultCV);
}

// ============================================================
// HELPER: Wrap openContractCall to capture txId via onFinish
// Returns a Promise that resolves with txId when user approves,
// or rejects if user cancels.
// ============================================================
function openContractCallWithTxId(options) {
  return new Promise((resolve, reject) => {
    openContractCall({
      ...options,
      onFinish: (data) => {
        console.log('✅ TX submitted:', data.txId);
        resolve(data.txId);
      },
      onCancel: () => {
        console.log('❌ User cancelled transaction');
        reject(new Error('Transaction cancelled by user'));
      },
    });
  });
}

// ============================================================
// HELPER: Poll Hiro API until transaction is confirmed
// ============================================================
export async function waitForTxConfirmation(txId, onProgress) {
  const maxAttempts = 24; // 24 * 10s = 4 minutes max
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      attempts++;
      try {
        const url = `https://api.testnet.hiro.so/extended/v1/tx/${txId}`;
        const res = await fetch(url);
        const data = await res.json();

        console.log(`TX status attempt ${attempts}:`, data.tx_status);

        if (data.tx_status === 'success') {
          clearInterval(interval);
          resolve('success');
        } else if (data.tx_status === 'abort_by_response' || data.tx_status === 'abort_by_post_condition') {
          clearInterval(interval);
          reject(new Error(`Transaction failed on chain: ${data.tx_status}`));
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          // Don't reject - tx may still confirm, just taking long
          resolve('timeout');
        } else {
          const secondsLeft = (maxAttempts - attempts) * 10;
          if (onProgress) onProgress(`Waiting for blockchain confirmation... (~${secondsLeft}s remaining)`);
        }
      } catch (err) {
        console.log('Error checking tx status:', err);
      }
    }, 10000); // check every 10 seconds
  });
}

// ============================================================
// HELPER: Check if a profile is valid (not empty/none)
// ============================================================
function isValidProfile(result) {
  if (!result) return false;
  const data = result.value || result;
  return !!(
    data['creator-username']?.value ||
    data['username']?.value ||
    data.bio?.value ||
    data['creator-username'] ||
    data.username ||
    data.bio
  );
}

// ============================================================
// CREATOR PROFILE FUNCTIONS
// ============================================================

export const createCreatorProfile = async (userAddress, username, displayName, bio) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: MAIN_FUNCTIONS.CREATE_CREATOR_PROFILE,
    functionArgs: [
      stringAsciiCV(username),
      stringUtf8CV(displayName),
      stringUtf8CV(bio),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

export const createPublicUserProfile = async (userAddress, username, displayName, bio) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: MAIN_FUNCTIONS.CREATE_PUBLIC_USER_PROFILE,
    functionArgs: [
      stringAsciiCV(username),
      stringUtf8CV(displayName),
      stringUtf8CV(bio),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

export const updateCreatorProfile = async (userAddress, displayName, bio) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: MAIN_FUNCTIONS.UPDATE_CREATOR_PROFILE,
    functionArgs: [
      stringUtf8CV(displayName),
      stringUtf8CV(bio),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

export const updatePublicUserProfile = async (userAddress, displayName, bio) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: MAIN_FUNCTIONS.UPDATE_PUBLIC_USER_PROFILE,
    functionArgs: [
      stringUtf8CV(displayName),
      stringUtf8CV(bio),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

export const getCreatorProfile = async (creatorAddress) => {
  try {
    const result = await readOnly(
      'storage-v4',
      'get-creator-profile',
      [principalCV(creatorAddress)]
    );
    if (!isValidProfile(result)) return null;
    return result.value || result;
  } catch (e) {
    return null;
  }
};

export const getPublicUserProfile = async (userAddress) => {
  try {
    const result = await readOnly(
      'storage-v4',
      'get-public-user-profile',
      [principalCV(userAddress)]
    );
    if (!result || Object.keys(result).length === 0) return null;
    return result;
  } catch (e) {
    return null;
  }
};

// ============================================================
// CONTENT FUNCTIONS
// ============================================================

export const publishContent = async (
  userAddress,
  title,
  description,
  contentHash,
  ipfsHash,
  category
) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: MAIN_FUNCTIONS.PUBLISH_CONTENT,
    functionArgs: [
      stringUtf8CV(title),
      stringUtf8CV(description),
      bufferCVFromString(contentHash.padEnd(32, '0').slice(0, 32)),
      ipfsHash ? someCV(stringAsciiCV(ipfsHash)) : noneCV(),
      uintCV(category),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

export const getContent = async (contentId) => {
  return await readOnly(
    CONTRACTS.MAIN.name,
    MAIN_FUNCTIONS.GET_CONTENT_DETAILS,
    [uintCV(contentId)]
  );
};

export const getCreatorContent = async (creatorAddress) => {
  return [];
};

// ============================================================
// TIPPING FUNCTIONS
// ============================================================

export const tipCreator = async (contentId, tipAmount, message, paymentToken) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: MAIN_FUNCTIONS.TIP_CREATOR,
    functionArgs: [
      uintCV(contentId),
      uintCV(tipAmount),
      stringUtf8CV(message),
      uintCV(paymentToken),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

// ============================================================
// FOLLOW FUNCTIONS
// ============================================================

export const followUser = async (creatorAddress) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: MAIN_FUNCTIONS.FOLLOW_USER,
    functionArgs: [principalCV(creatorAddress)],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

export const unfollowUser = async (creatorAddress) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: MAIN_FUNCTIONS.UNFOLLOW_USER,
    functionArgs: [principalCV(creatorAddress)],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

// ============================================================
// SUBSCRIPTION FUNCTIONS
// ============================================================

export const subscribeToCreator = async (creatorAddress, tier, paymentToken) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: MAIN_FUNCTIONS.SUBSCRIBE_TO_CREATOR,
    functionArgs: [
      principalCV(creatorAddress),
      uintCV(tier),
      uintCV(paymentToken),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

export const cancelSubscription = async (creatorAddress) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: MAIN_FUNCTIONS.CANCEL_SUBSCRIPTION,
    functionArgs: [principalCV(creatorAddress)],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

export const getUserSubscription = async (userAddress) => {
  return await readOnly(
    CONTRACTS.MAIN.name,
    MAIN_FUNCTIONS.GET_USER_SUBSCRIPTION,
    [principalCV(userAddress)]
  );
};

// ============================================================
// NFT FUNCTIONS
// ============================================================

export const mintFashionNFT = async (collectionId, recipient, name, description, imageIpfsHash) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.NFT.name,
    functionName: NFT_FUNCTIONS.MINT,
    functionArgs: [
      uintCV(collectionId),
      principalCV(recipient),
      stringUtf8CV(name),
      stringUtf8CV(description),
      stringAsciiCV(imageIpfsHash),
      noneCV(),
      noneCV(),
      noneCV(),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

export const createNFTCollection = async (collectionName, description, maxEditions) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: 'create-nft-collection',
    functionArgs: [
      stringUtf8CV(collectionName),
      stringUtf8CV(description),
      uintCV(maxEditions),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

export const listNFTForSale = async (tokenId, price) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: NFT_FUNCTIONS.LIST_NFT,
    functionArgs: [
      uintCV(tokenId),
      uintCV(price),
    ],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

export const buyNFT = async (tokenId) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: NFT_FUNCTIONS.BUY_NFT,
    functionArgs: [uintCV(tokenId)],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

export const cancelNFTListing = async (tokenId) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: NFT_FUNCTIONS.CANCEL_LISTING,
    functionArgs: [uintCV(tokenId)],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

export const getNFTListing = async (tokenId) => {
  return await readOnly(
    CONTRACTS.MAIN.name,
    'get-nft-listing',
    [uintCV(tokenId)]
  );
};

// ============================================================
// VAULT FUNCTIONS
// ============================================================

export const getCreatorVaultInfo = async (creatorAddress) => {
  return await readOnly(
    CONTRACTS.MAIN.name,
    BRIDGE_FUNCTIONS.GET_VAULT_INFO,
    [principalCV(creatorAddress)]
  );
};

export const setVaultThreshold = async (threshold) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: BRIDGE_FUNCTIONS.SET_THRESHOLD,
    functionArgs: [uintCV(threshold)],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

export const withdrawFromVault = async (amount) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: 'withdraw-from-vault',
    functionArgs: [uintCV(amount)],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

// ============================================================
// USDCX TOKEN FUNCTIONS
// ============================================================

export const mintTestUSDCx = async (amount, recipient) => {
  return openContractCallWithTxId({
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.USDCX_TOKEN.name,
    functionName: USDCX_FUNCTIONS.MINT,
    functionArgs: [uintCV(amount), principalCV(recipient)],
    postConditionMode: PostConditionMode.Allow,
    network,
    anchorMode: AnchorMode.Any,
  });
};

export const getUSDCxBalance = async (address) => {
  const result = await readOnly(
    CONTRACTS.USDCX_TOKEN.name,
    USDCX_FUNCTIONS.GET_BALANCE,
    [principalCV(address)]
  );
  if (result && typeof result === 'object' && result.value !== undefined) {
    return Number(result.value);
  }
  return Number(result) || 0;
};

export const getSbtcBalance = async (address) => {
  const result = await readOnly(
    CONTRACTS.SBTC_TOKEN.name,
    'get-balance',
    [principalCV(address)]
  );
  if (result && typeof result === 'object' && result.value !== undefined) {
    return Number(result.value) / 100000000;
  }
  return 0;
};

// ============================================================
// PLATFORM STATS
// ============================================================

export const getPlatformStats = async () => {
  return await readOnly(
    CONTRACTS.MAIN.name,
    MAIN_FUNCTIONS.GET_PLATFORM_STATS,
    []
  );
};

export const getNFTMarketplaceStats = async () => {
  return await readOnly(
    CONTRACTS.MAIN.name,
    'get-nft-marketplace-stats',
    []
  );
};
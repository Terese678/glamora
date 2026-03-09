// Contract Calls for Glamora
// All functions here call your deployed Clarity smart contracts on Stacks testnet

import {
  CONTRACT_CONFIG,
  CONTRACTS,
  MAIN_FUNCTIONS,
  NFT_FUNCTIONS,
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
  stringUtf8CV,
  principalCV,
  boolCV,
  noneCV,
  someCV,
  bufferCVFromString,
} from '@stacks/transactions';

import { STACKS_TESTNET } from '@stacks/network';
import { openContractCall } from '@stacks/connect';
import { fetchCallReadOnlyFunction, cvToValue } from '@stacks/transactions';

const network = STACKS_TESTNET;

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

export const createCreatorProfile = async (
  userAddress,
  username,
  displayName,
  bio
) => {
  const options = {
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

export const createPublicUserProfile = async (
  userAddress,
  username,
  displayName,
  bio
) => {
  const options = {
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

export const updateCreatorProfile = async (
  userAddress,
  displayName,
  bio
) => {
  const options = {
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

export const updatePublicUserProfile = async (
  userAddress,
  displayName,
  bio
) => {
  const options = {
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

export const getCreatorProfile = async (creatorAddress) => {
  return await readOnly(
    CONTRACTS.MAIN.name,
    MAIN_FUNCTIONS.GET_CREATOR_PROFILE,
    [principalCV(creatorAddress)]
  );
};

export const getPublicUserProfile = async (userAddress) => {
  return await readOnly(
    CONTRACTS.MAIN.name,
    MAIN_FUNCTIONS.GET_PUBLIC_USER_PROFILE,
    [principalCV(userAddress)]
  );
};

// ============================================================
// CONTENT FUNCTIONS
// Contract: main-v7
// ============================================================

export const publishContent = async (
  title,
  description,
  contentHash,
  ipfsHash,
  category
) => {
  const options = {
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
    onFinish: (data) => {
      console.log('✅ Content published:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ Content publish cancelled');
    },
  };
  await openContractCall(options);
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
// Contract: main-v7
// ============================================================

export const tipCreator = async (
  contentId,
  tipAmount,
  message,
  paymentToken,
  userSession
) => {
  const options = {
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

export const followUser = async (creatorAddress, userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
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

export const unfollowUser = async (creatorAddress, userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
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
// ============================================================

export const subscribeToCreator = async (
  creatorAddress,
  tier,
  paymentToken,
  userSession
) => {
  const options = {
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

export const cancelSubscription = async (creatorAddress, userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
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

export const getUserSubscription = async (userAddress) => {
  return await readOnly(
    CONTRACTS.MAIN.name,
    MAIN_FUNCTIONS.GET_USER_SUBSCRIPTION,
    [principalCV(userAddress)]
  );
};

// ============================================================
// NFT FUNCTIONS
// Contract: glamora-nft-v2
// ============================================================

export const mintFashionNFT = async (
  collectionId,
  recipient,
  name,
  description,
  imageIpfsHash,
  userSession
) => {
  const options = {
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

export const createNFTCollection = async (
  collectionName,
  description,
  maxEditions,
  userSession
) => {
  const options = {
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
    onFinish: (data) => {
      console.log('✅ Collection created:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('❌ Collection creation cancelled');
    },
  };
  await openContractCall(options);
};

export const listNFTForSale = async (tokenId, price, userSession) => {
  const options = {
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

export const buyNFT = async (tokenId, userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: NFT_FUNCTIONS.BUY_NFT,
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

export const cancelNFTListing = async (tokenId, userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: NFT_FUNCTIONS.CANCEL_LISTING,
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

export const getNFTListing = async (tokenId) => {
  return await readOnly(
    CONTRACTS.MAIN.name,
    'get-nft-listing',
    [uintCV(tokenId)]
  );
};

// ============================================================
// VAULT FUNCTIONS
// Contract: main-v7
// ============================================================

export const getCreatorVaultInfo = async (creatorAddress) => {
  return await readOnly(
    CONTRACTS.MAIN.name,
    BRIDGE_FUNCTIONS.GET_VAULT_INFO,
    [principalCV(creatorAddress)]
  );
};

export const setVaultThreshold = async (threshold, userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
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

export const withdrawFromVault = async (amount, userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.MAIN.name,
    functionName: 'withdraw-from-vault',
    functionArgs: [uintCV(amount)],
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
// ============================================================

export const mintTestUSDCx = async (amount, recipient, userSession) => {
  const options = {
    contractAddress: CONTRACT_CONFIG.DEPLOYER_ADDRESS,
    contractName: CONTRACTS.USDCX_TOKEN.name,
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

export const getUSDCxBalance = async (address) => {
  return await readOnly(
    CONTRACTS.USDCX_TOKEN.name,
    USDCX_FUNCTIONS.GET_BALANCE,
    [principalCV(address)]
  );
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
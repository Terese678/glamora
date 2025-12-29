// Contract Calls functions to interact with the smart contract
// this file contains all the functions to call your Glamora smart contract

import {
  CONTRACT_CONFIG,
  CONTRACTS,
  MAIN_FUNCTIONS,
  NFT_FUNCTIONS,
  CONTENT_CATEGORIES,
  SUBSCRIPTION_TIERS,
  MIN_TIP_AMOUNT
} from './contractConfig';

import {
  callContract,
  fetchCallReadOnlyFunction,
  cv,
  Cl,
  getContractPrincipal,
  generateMockIPFSHash,
  handleContractError,
  getNetwork
} from './stacksUtils';

import { stringAsciiCV, stringUtf8CV, uintCV, AnchorMode, PostConditionMode } from '@stacks/transactions';

// Register a new user on the platform
export const registerUser = async (userSession, username, bio) => {
  try {
    const functionArgs = [
      cv.string(username),
      cv.string(bio)
    ];

    await callContract(
      userSession,
      MAIN_FUNCTIONS.REGISTER_USER,
      functionArgs,
      (result) => {
        console.log('User registered:', result);
        alert('Successfully registered!');
      }
    );
  } catch (error) {
    handleContractError(error);
  }
};

// List a new product for sale
export const listProduct = async (userSession, productName, description, price, category, imageUrl) => {
  try {
    const ipfsHash = generateMockIPFSHash();
    
    const functionArgs = [
      cv.string(productName),
      cv.string(description),
      cv.uint(price),
      cv.string(category),
      cv.string(imageUrl || ipfsHash)
    ];

    await callContract(
      userSession,
      MAIN_FUNCTIONS.LIST_PRODUCT,
      functionArgs,
      (result) => {
        console.log('Product listed:', result);
        alert('Product listed successfully!');
      }
    );
  } catch (error) {
    handleContractError(error);
  }
};

// Buy a product
export const buyProduct = async (userSession, productId) => {
  try {
    const functionArgs = [
      cv.uint(productId)
    ];

    await callContract(
      userSession,
      MAIN_FUNCTIONS.BUY_PRODUCT,
      functionArgs,
      (result) => {
        console.log('Product purchased:', result);
        alert('Purchase successful!');
      }
    );
  } catch (error) {
    handleContractError(error);
  }
};

// Get product details (read-only)
export const getProduct = async (productId) => {
  try {
    const functionArgs = [cv.uint(productId)];
    
    const result = await fetchCallReadOnlyFunction({
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,
      functionName: MAIN_FUNCTIONS.GET_PRODUCT,
      functionArgs,
      senderAddress: CONTRACT_CONFIG.address,
    });

    return result;
  } catch (error) {
    handleContractError(error);
    return null;
  }
};

// Get user details (read-only)
export const getUser = async (userAddress) => {
  try {
    const functionArgs = [cv.principal(userAddress)];
    
    const result = await fetchCallReadOnlyFunction({
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,
      functionName: MAIN_FUNCTIONS.GET_USER,
      functionArgs,
      senderAddress: CONTRACT_CONFIG.address,
    });

    return result;
  } catch (error) {
    handleContractError(error);
    return null;
  }
};

// Add a review for a product
export const addReview = async (userSession, productId, rating, comment) => {
  try {
    const functionArgs = [
      cv.uint(productId),
      cv.uint(rating),
      cv.string(comment)
    ];

    await callContract(
      userSession,
      MAIN_FUNCTIONS.ADD_REVIEW,
      functionArgs,
      (result) => {
        console.log('Review added:', result);
        alert('Review submitted successfully!');
      }
    );
  } catch (error) {
    handleContractError(error);
  }
};

/**
 * CREATE CREATOR PROFILE
 * Calls the main-v4 contract to create a new creator profile on the blockchain
 * 
 * @param {string} userAddress - The Stacks address of the user creating the profile
 * @param {string} username - The creator's username (must be unique, ASCII only)
 * @param {string} displayName - The creator's display name (can contain UTF-8 characters)
 * @param {string} bio - The creator's biography/description
 * @returns {Promise} - Resolves when wallet approval completes
 */
export const createCreatorProfile = async (userAddress, username, displayName, bio) => {
  try {
    // Log all input parameters for debugging
    console.log('=== CREATING CREATOR PROFILE ===');
    console.log('User Address:', userAddress);
    console.log('Username:', username);
    console.log('Display Name:', displayName);
    console.log('Bio:', bio);

    // Prepare function arguments in Clarity value format
    // stringAsciiCV: for ASCII-only strings (usernames)
    // stringUtf8CV: for UTF-8 strings (display names, bios with special characters)
    const functionArgs = [
      stringAsciiCV(username),      // arg0: username (ASCII only, permanent)
      stringUtf8CV(displayName),    // arg1: display-name (UTF-8, can be updated)
      stringUtf8CV(bio)             // arg2: bio (UTF-8, can be updated)
    ];

    // Log prepared arguments for verification
    console.log('Function args prepared:', functionArgs);
    console.log('Contract:', CONTRACT_CONFIG.address + '.main-v4');
    console.log('Function: create-creator-profile');

    // Import required Stacks dependencies dynamically
    const { openContractCall } = await import('@stacks/connect');
    const { STACKS_TESTNET } = await import('@stacks/network');

    // Configure the transaction options
    const txOptions = {
      contractAddress: CONTRACT_CONFIG.address,  // Your deployer address
      contractName: 'main-v3',                   // The contract name (must match deployed contract)
      functionName: 'create-creator-profile',    // The public function to call
      functionArgs: functionArgs,                // The prepared arguments array
      network: STACKS_TESTNET,                   // Target network (testnet constant)
      appDetails: {
        name: 'Glamora',                         // App name shown in wallet
        icon: window.location.origin + '/logo.png', // App icon shown in wallet
      },
      // Callback when user approves transaction in wallet
      onFinish: (data) => {
        console.log('=== WALLET APPROVED ===');
        console.log('Transaction data received:', data);
        console.log('Transaction ID:', data.txId);
        return data;
      },
      // Callback when user cancels transaction in wallet
      onCancel: () => {
        console.log('=== TRANSACTION CANCELLED ===');
        throw new Error('Transaction cancelled by user');
      }
    };

    // Open the Leather wallet for user approval
    console.log('=== OPENING WALLET ===');
    const result = await openContractCall(txOptions);
    return result;

  } catch (error) {
    // Log any errors that occur during the process
    console.error('=== ERROR IN CREATE CREATOR PROFILE ===');
    console.error('Error details:', error);
    throw error; // Re-throw so calling function can handle it
  }
};

/**
 * CREATE PUBLIC USER PROFILE
 * Creates a new public user profile on the blockchain
 */
export const createPublicUserProfile = async (userAddress, username, displayName, bio) => {
  try {
    console.log('Creating public user profile...');
    console.log('Username:', username);
    console.log('Display Name:', displayName);
    console.log('Bio:', bio);
    
    const { openContractCall } = await import('@stacks/connect');
    const { AppConfig, UserSession } = await import('@stacks/auth');
    const { AnchorMode, PostConditionMode } = await import('@stacks/transactions');
    
    const appConfig = new AppConfig(['store_write', 'publish_data']);
    const userSession = new UserSession({ appConfig });
    
    const functionArgs = [
      Cl.stringAscii(username),
      Cl.stringUtf8(displayName),
      Cl.stringUtf8(bio)
    ];
    
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: 'main-v4',
      functionName: 'create-public-user-profile',
      functionArgs: functionArgs,
      userSession: userSession,
      appDetails: {
        name: 'Glamora',
        icon: window.location.origin + '/logo.png',
      },
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('Transaction broadcast:', data);
        console.log('Transaction ID:', data.txId);
      },
      onCancel: () => {
        console.log('Transaction cancelled by user');
      }
    };
    
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error creating public user profile:', error);
    throw error;
  }
};

// TIP CREATOR - Sends cryptocurrency to a creator as a tip
export const tipCreator = async (userAddress, recipientAddress, amount) => {
  try {
    console.log('Sending tip...');
    console.log('To:', recipientAddress);
    console.log('Amount (microSTX):', amount);
    
    const { openContractCall } = await import('@stacks/connect');
    const { AnchorMode, PostConditionMode } = await import('@stacks/transactions');
    
    const functionArgs = [
      cv.principal(recipientAddress),
      cv.uint(amount)
    ];
    
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,
      functionName: 'tip-creator',  
      functionArgs: functionArgs,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('Tip sent:', data);
      },
      onCancel: () => {
        console.log('Tip cancelled');
      }
    };
    
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error sending tip:', error);
    throw error;
  }
};

// GET PROFILE - Reads a user's profile from the blockchain (READ-ONLY)
export const getProfile = async (userAddress) => {
  try {
    console.log('Fetching profile for:', userAddress);
    
    const functionArgs = [cv.principal(userAddress)];
    
    const options = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,
      functionName: 'get-profile',  
      functionArgs: functionArgs,
      senderAddress: CONTRACT_CONFIG.address,
    };
    
    const result = await fetchCallReadOnlyFunction(options);
    
    console.log('Profile result:', result);
    
    return result;
    
  } catch (error) {
    console.log('No profile found:', error.message);
    return null;
  }
};

// Export categories and tiers for use in UI
export { CONTENT_CATEGORIES, SUBSCRIPTION_TIERS, MIN_TIP_AMOUNT };

/**
 * GET CREATOR PROFILE
 * Fetches a creator profile from the storage contract
 * 
 * @param {string} userAddress - The Stacks address of the creator
 * @returns {Promise<Object|null>} - The creator profile data or null if not found
 */
export const getCreatorProfile = async (userAddress) => {
  try {
    console.log('Fetching creator profile for:', userAddress);
    
    // Prepare function arguments with the user's principal address
    const functionArgs = [Cl.principal(userAddress)];
    
    // Configure the read-only function call options
    const options = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: 'storage',
      functionName: 'get-creator-profile',
      functionArgs: functionArgs,
      senderAddress: userAddress,
    };
    
    // Execute the read-only function call
    const result = await fetchCallReadOnlyFunction(options);
    
    // Log raw result to see its structure
    console.log('Creator profile raw result:', result);
    
    // Check if no profile exists
    if (result.type === 'none') {
      console.log('No creator profile found (type: none)');
      return null;
    }
    
    // Extract profile data - the data might be in result.value itself or result.value.value
    if (result.type === 'some') {
      // Try to access the tuple data - it could be in different places
      const tupleData = result.value.data || result.value.value || result.value;
      
      console.log('Extracted tuple data:', tupleData);
      console.log('Tuple data type:', typeof tupleData);
      
      // If tupleData is an object with profile fields, extract them
      if (tupleData && typeof tupleData === 'object') {
        // Try to extract the actual values - they might be nested in .value or .data properties
        const convertedProfile = {
          username: tupleData.username?.data || tupleData.username?.value || tupleData.username || '',
          displayName: tupleData['display-name']?.data || tupleData['display-name']?.value || tupleData['display-name'] || '',
          bio: tupleData.bio?.data || tupleData.bio?.value || tupleData.bio || '',
          followerCount: Number(tupleData['follower-count']?.value || tupleData['follower-count'] || 0),
          creatorScore: Number(tupleData['creator-score']?.value || tupleData['creator-score'] || 0),
          totalEarnings: Number(tupleData['total-earnings']?.value || tupleData['total-earnings'] || 0),
          creationDate: Number(tupleData['creation-date']?.value || tupleData['creation-date'] || 0),
          profilePictureUrl: tupleData['profile-picture-url']?.data || tupleData['profile-picture-url']?.value || tupleData['profile-picture-url'] || '',
          verified: tupleData.verified?.type === 'true' || tupleData.verified === true || false,
        };
        
        console.log('Creator profile parsed:', convertedProfile);
        return convertedProfile;
      }
    }
    
    console.log('Could not extract profile data');
    return null;
    
  } catch (error) {
    console.error('Error fetching creator profile:', error);
    return null;
  }
};

/**
 * GET PUBLIC USER PROFILE
 * Fetches a public user profile from the storage contract
 * 
 * @param {string} userAddress - The Stacks address of the public user
 * @returns {Promise<Object|null>} - The public user profile data or null if not found
 */
export const getPublicUserProfile = async (userAddress) => {
  try {
    console.log('Fetching public user profile for:', userAddress);
    
    // Prepare function arguments with the user's principal address
    const functionArgs = [Cl.principal(userAddress)];
    
    // Configure the read-only function call options
    const options = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: 'storage',
      functionName: 'get-public-user-profile',
      functionArgs: functionArgs,
      senderAddress: userAddress,
    };
    
    // Execute the read-only function call
    const result = await fetchCallReadOnlyFunction(options);
    
    // Log raw result to see its structure
    console.log('Public user profile raw result:', result);
    
    // Check if no profile exists
    if (result.type === 'none') {
      console.log('No public user profile found (type: none)');
      return null;
    }
    
    // Extract profile data - the data might be in result.value itself or result.value.value
    if (result.type === 'some') {
      // Try to access the tuple data - it could be in different places
      const tupleData = result.value.data || result.value.value || result.value;
      
      console.log('Extracted tuple data:', tupleData);
      console.log('Tuple data type:', typeof tupleData);
      
      // If tupleData is an object with profile fields, extract them
      if (tupleData && typeof tupleData === 'object') {
        // Try to extract the actual values - they might be nested in .value or .data properties
        const convertedProfile = {
          username: tupleData.username?.data || tupleData.username?.value || tupleData.username || '',
          displayName: tupleData['display-name']?.data || tupleData['display-name']?.value || tupleData['display-name'] || '',
          bio: tupleData.bio?.data || tupleData.bio?.value || tupleData.bio || '',
          joinedDate: Number(tupleData['joined-date']?.value || tupleData['joined-date'] || 0),
          profilePictureUrl: tupleData['profile-picture-url']?.data || tupleData['profile-picture-url']?.value || tupleData['profile-picture-url'] || '',
        };
        
        console.log('Public user profile parsed:', convertedProfile);
        return convertedProfile;
      }
    }
    
    console.log('Could not extract profile data');
    return null;
    
  } catch (error) {
    console.error('Error fetching public user profile:', error);
    return null;
  }
};

/**
 * PUBLISH CONTENT FUNCTION
 * This publishContent function supports IPFS hash
 */
export const publishContent = async (userAddress, title, description, contentHash, ipfsHash, category) => {
  try {
    console.log('Publishing content...');
    console.log('Title:', title);
    console.log('Description:', description);
    console.log('Content Hash:', contentHash);
    console.log('IPFS Hash:', ipfsHash);
    console.log('Category:', category);
    
    const { openContractCall } = await import('@stacks/connect');
    const { 
      AnchorMode, 
      PostConditionMode, 
      stringUtf8CV, 
      stringAsciiCV,    // ← Make sure this is imported!
      bufferCV, 
      someCV, 
      noneCV, 
      uintCV 
    } = await import('@stacks/transactions');
    
    // Convert content hash from hex string to buffer (32 bytes)
    const hashBuffer = contentHash.startsWith('0x') ? contentHash.slice(2) : contentHash;
    
    // Ensure hash is exactly 64 hex characters (32 bytes)
    const paddedHash = hashBuffer.padEnd(64, '0');
    
    // Convert to Uint8Array
    const hashBytes = new Uint8Array(
      paddedHash.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );
    
    const contentHashBuffer = bufferCV(Buffer.from(hashBytes));
    
    // CRITICAL FIX: Use stringAsciiCV for IPFS hash (not stringUtf8CV)
    // Contract expects: (optional (string-ascii 64))
    const ipfsHashParam = ipfsHash ? someCV(stringAsciiCV(ipfsHash)) : noneCV();
    
    const functionArgs = [
      stringUtf8CV(title),           // param 1: title (string-utf8 64)
      stringUtf8CV(description),     // param 2: description (string-utf8 256)
      contentHashBuffer,             // param 3: content-hash (buff 32)
      ipfsHashParam,                 // param 4: ipfs-hash (optional string-ascii 64)
      uintCV(category)               // param 5: category (uint)
    ];
    
    console.log('Function args prepared:', functionArgs);
    
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,
      functionName: 'publish-content',
      functionArgs: functionArgs,
      appDetails: {
        name: 'Glamora',
        icon: window.location.origin + '/logo.png',
      },
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('Content published:', data);
        console.log('Transaction ID:', data.txId);
      },
      onCancel: () => {
        console.log('Publishing cancelled');
      }
    };
    
    console.log('Opening wallet for approval...');
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error publishing content:', error);
    throw error;
  }
};

/**
 * GET CREATOR'S CONTENT
 * Fetches all content published by a creator
 */
export const getCreatorContent = async (creatorAddress) => {
  try {
    console.log('Fetching content for creator:', creatorAddress);
    
    // First, get the total number of content items
    const nextIdResult = await fetchCallReadOnlyFunction({
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,
      functionName: 'get-next-content-id',
      functionArgs: [],
      senderAddress: CONTRACT_CONFIG.address,
    });
    
    const totalContent = Number(nextIdResult.value);
    console.log('Total content items:', totalContent);
    
    if (totalContent === 0) {
      return [];
    }
    
    // Fetch each content item
    const contentPromises = [];
    for (let i = 0; i < totalContent; i++) {
      contentPromises.push(
        fetchCallReadOnlyFunction({
          network: getNetwork(),
          contractAddress: CONTRACT_CONFIG.address,
          contractName: CONTRACT_CONFIG.name,
          functionName: 'get-content-details',
          functionArgs: [uintCV(i)],
          senderAddress: CONTRACT_CONFIG.address,
        })
      );
    }
    
    const contentResults = await Promise.all(contentPromises);
    
    // Filter content by creator and parse the data
    const creatorContent = contentResults
      .map((result, index) => {
        if (!result) {
          console.log(`Content ${index}: Result is null/undefined`);
          return null;
        }
        
        console.log(`Content ${index} full result:`, result);
        console.log(`Content ${index} result type:`, result.type);
        
        if (result.type !== 'ok' && result.type !== 'some') {
          console.log(`Content ${index}: Invalid result type`);
          return null;
        }
        
        const contentData = result.value.data || result.value;
        
        // Handle tuple structure
        const actualData = contentData.type === 'tuple' ? contentData.value : contentData;
        
        console.log(`Content ${index} contentData FULL:`, contentData);
        
        // Debug: Log the creator address from content
        console.log(`Content ${index} creator:`, actualData.creator);
        console.log(`Content ${index} creator FULL:`, JSON.stringify(actualData.creator, null, 2));
        console.log(`Content ${index} creator address:`, actualData.creator.value);
        console.log(`Expected creator:`, creatorAddress);
        console.log(`Match?`, actualData.creator.value === creatorAddress);
        
        // Check if this content belongs to the creator
        if (actualData.creator.value !== creatorAddress) {
          console.log(`Content ${index}: NOT a match, skipping`);
          return null;
        }
        
        console.log(`Content ${index}: MATCH! Adding to results`);
        
        return {
          id: index,
          title: actualData.title?.value || actualData.title?.data || 'Untitled',
          description: actualData.description?.value || actualData.description?.data || 'No description',
          ipfsHash: actualData['content-hash']?.value?.data || actualData['ipfs-hash']?.value?.data || null,
          category: Number(actualData.category?.value || 0),
          timestamp: Number(actualData['creation-date']?.value || 0),
          creator: actualData.creator.value
        };
      })
      .filter(item => item !== null);
    
    console.log('Creator content:', creatorContent);
    return creatorContent;
    
  } catch (error) {
    console.error('Error fetching creator content:', error);
    return [];
  }
};
// ============================================================
// NFT MARKETPLACE FUNCTIONS 
// ============================================================

// LIST FASHION NFT FOR SALE
export const listFashionNFT = async (tokenId, priceInSTX) => {
  try {
    console.log('Listing NFT for sale...');
    console.log('Token ID:', tokenId);
    console.log('Price:', priceInSTX, 'STX');
    
    const { openContractCall } = await import('@stacks/connect');
    const { AnchorMode, PostConditionMode, uintCV } = await import('@stacks/transactions');
    
    const priceInMicroSTX = Math.floor(priceInSTX * 1000000);
    
    const functionArgs = [
      uintCV(tokenId),
      uintCV(priceInMicroSTX)
    ];
    
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,
      functionName: 'list-fashion-nft',
      functionArgs: functionArgs,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('NFT listed successfully:', data);
      },
      onCancel: () => {
        console.log('Listing cancelled by user');
      }
    };
    
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error listing NFT:', error);
    throw error;
  }
};

// PURCHASE FASHION NFT
export const purchaseFashionNFT = async (tokenId, maxPriceInSTX) => {
  try {
    console.log('Purchasing NFT...');
    console.log('Token ID:', tokenId);
    console.log('Max Price:', maxPriceInSTX, 'STX');
    
    const { openContractCall } = await import('@stacks/connect');
    const { AnchorMode, PostConditionMode, uintCV } = await import('@stacks/transactions');
    
    const maxPriceInMicroSTX = Math.floor(maxPriceInSTX * 1000000);
    
    const functionArgs = [
      uintCV(tokenId),
      uintCV(maxPriceInMicroSTX)
    ];
    
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,
      functionName: 'purchase-fashion-nft',
      functionArgs: functionArgs,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('NFT purchased successfully:', data);
      },
      onCancel: () => {
        console.log('Purchase cancelled by user');
      }
    };
    
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error purchasing NFT:', error);
    throw error;
  }
};

// UNLIST FASHION NFT
export const unlistFashionNFT = async (tokenId) => {
  try {
    console.log('Unlisting NFT...');
    console.log('Token ID:', tokenId);
    
    const { openContractCall } = await import('@stacks/connect');
    const { AnchorMode, PostConditionMode, uintCV } = await import('@stacks/transactions');
    
    const functionArgs = [
      uintCV(tokenId)
    ];
    
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,
      functionName: 'unlist-fashion-nft',
      functionArgs: functionArgs,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('NFT unlisted successfully:', data);
      },
      onCancel: () => {
        console.log('Unlisting cancelled by user');
      }
    };
    
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error unlisting NFT:', error);
    throw error;
  }
};

// GET NFT LISTING
export const getNFTListing = async (tokenId) => {
  try {
    console.log('Fetching NFT listing for token:', tokenId);
    
    const { callReadOnlyFunction, cvToJSON } = await import('@stacks/transactions');
    const { STACKS_TESTNET } = await import('@stacks/network');
    
    const functionArgs = [
      Cl.uint(tokenId)
    ];
    
    const options = {
      network: STACKS_TESTNET,
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,
      functionName: 'get-nft-listing',
      functionArgs: functionArgs,
      senderAddress: CONTRACT_CONFIG.address,
    };
    
    const result = await callReadOnlyFunction(options);
    const listingData = cvToJSON(result);
    
    console.log('NFT listing data:', listingData);
    return listingData;
    
  } catch (error) {
    console.error('Error fetching NFT listing:', error);
    return null;
  }
};

// GET MARKETPLACE STATISTICS
export const getMarketplaceStats = async () => {
  try {
    console.log('Fetching marketplace statistics...');
    
    const { callReadOnlyFunction, cvToJSON } = await import('@stacks/transactions');
    const { STACKS_TESTNET } = await import('@stacks/network');
    
    const options = {
      network: STACKS_TESTNET,
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,
      functionName: 'get-marketplace-stats',
      functionArgs: [],
      senderAddress: CONTRACT_CONFIG.address,
    };
    
    const result = await callReadOnlyFunction(options);
    const statsData = cvToJSON(result);
    
    console.log('Marketplace stats:', statsData);
    return statsData;
    
  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    return null;
  }
};

// CREATE NFT COLLECTION
export const createNFTCollection = async (collectionName, description, maxEditions) => {
  try {
    console.log('Creating NFT collection...');
    console.log('Name:', collectionName);
    console.log('Max Editions:', maxEditions);
    
    const { openContractCall } = await import('@stacks/connect');
    const { AnchorMode, PostConditionMode, stringUtf8CV, uintCV } = await import('@stacks/transactions');
    
    const functionArgs = [
      stringUtf8CV(collectionName),
      stringUtf8CV(description),
      uintCV(maxEditions)
    ];
    
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,
      functionName: 'create-nft-collection',
      functionArgs: functionArgs,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('Collection created successfully:', data);
      },
      onCancel: () => {
        console.log('Collection creation cancelled');
      }
    };
    
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
};

// MINT FASHION NFT
export const mintFashionNFT = async (collectionId, recipientAddress, name, description, imageIpfsHash) => {
  try {
    console.log('Minting NFT...');
    console.log('Collection ID:', collectionId);
    console.log('Name:', name);
    
    const { openContractCall } = await import('@stacks/connect');
    const { 
      AnchorMode, 
      PostConditionMode, 
      uintCV, 
      principalCV,
      stringUtf8CV,
      stringAsciiCV,
      noneCV 
    } = await import('@stacks/transactions');
    
    const functionArgs = [
      uintCV(collectionId),
      principalCV(recipientAddress),
      stringUtf8CV(name),
      stringUtf8CV(description),
      stringAsciiCV(imageIpfsHash),
      noneCV(),
      noneCV(),
      noneCV()
    ];
    
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: 'glamora-nft',
      functionName: 'mint-fashion-nft',
      functionArgs: functionArgs,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('NFT minted successfully:', data);
      },
      onCancel: () => {
        console.log('Minting cancelled');
      }
    };
    
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error minting NFT:', error);
    throw error;
  }
};

// UPDATE CREATOR PROFILE
export const updateCreatorProfile = async (userAddress, displayName, bio) => {
  try {
    console.log('=== UPDATING CREATOR PROFILE ===');
    console.log('User Address:', userAddress);
    console.log('Display Name:', displayName);
    console.log('Bio:', bio);
    
    const { openContractCall } = await import('@stacks/connect');
    const { AnchorMode, PostConditionMode } = await import('@stacks/transactions');
    
    const functionArgs = [
      Cl.stringUtf8(displayName),
      Cl.stringUtf8(bio)
    ];
    
    console.log('Function args:', functionArgs);
    
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: 'main-v4',
      functionName: 'update-creator-profile',
      functionArgs: functionArgs,
      appDetails: {
        name: 'Glamora',
        icon: window.location.origin + '/logo.png',
      },
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('Profile Update Transaction SUCCESS:', data);
        console.log('Transaction ID:', data.txId);
      },
      onCancel: () => {
        console.log('Transaction cancelled');
      }
    };
    
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error updating creator profile:', error);
    throw error;
  }
};

// UPDATE PUBLIC USER PROFILE
export const updatePublicUserProfile = async (userAddress, displayName, bio) => {
  try {
    console.log('=== UPDATING PUBLIC USER PROFILE ===');
    console.log('User Address:', userAddress);
    console.log('Display Name:', displayName);
    console.log('Bio:', bio);
    
    const { openContractCall } = await import('@stacks/connect');
    const { AnchorMode, PostConditionMode } = await import('@stacks/transactions');
    
    const functionArgs = [
      Cl.stringUtf8(displayName),
      Cl.stringUtf8(bio)
    ];
    
    console.log('Function args:', functionArgs);
    
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: 'main-v4',
      functionName: 'update-public-user-profile',
      functionArgs: functionArgs,
      appDetails: {
        name: 'Glamora',
        icon: window.location.origin + '/logo.png',
      },
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('Profile Update Transaction SUCCESS:', data);
        console.log('Transaction ID:', data.txId);
      },
      onCancel: () => {
        console.log('Transaction cancelled');
      }
    };
    
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error updating public user profile:', error);
    throw error;
  }
};


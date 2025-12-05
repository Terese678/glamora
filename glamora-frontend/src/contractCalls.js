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
  getContractPrincipal,
  generateMockIPFSHash,
  handleContractError,
  getNetwork
} from './stacksUtils';

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
 * this creates a new creator account on the blockchain
 */
export const createCreatorProfile = async (userAddress, creatorName, bio) => {
  try {
    console.log('Creating creator profile...');
    console.log('Name:', creatorName);
    console.log('Bio:', bio);
    
    // Import Stacks functions dynamically
    const { openContractCall } = await import('@stacks/connect');
    const { AnchorMode, PostConditionMode } = await import('@stacks/transactions');
    
    // Prepare the data in blockchain format
    const functionArgs = [
      cv.string(creatorName),  // Creator's display name
      cv.string(bio)           // Creator's bio
    ];
    
    // Set up the transaction
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,
      functionName: 'create-creator-profile',  // Must match your Clarity contract
      functionArgs: functionArgs,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('Transaction broadcast:', data);
      },
      onCancel: () => {
        console.log('Transaction cancelled by user');
      }
    };
    
    // Open wallet and send transaction
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error creating creator profile:', error);
    throw error;
  }
};


/**
 * TIP CREATOR
 * Sends cryptocurrency to a creator as a tip
 */
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

/**
 * GET PROFILE
 * Reads a user's profile from the blockchain (READ-ONLY)
 */
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
 * Reads a creator's profile from the blockchain (READ-ONLY)
 * This fetches the full creator profile including username, bio, follower count, etc.
 */
export const getCreatorProfile = async (userAddress) => {
  try {
    console.log('Fetching creator profile for:', userAddress);
    
    // Import required Stacks functions
    const { callReadOnlyFunction, cvToJSON } = await import('@stacks/transactions');
    const { StacksTestnet } = await import('@stacks/network');
    
    // Prepare the function arguments - just the user's wallet address
    const functionArgs = [
      Cl.principal(userAddress)
    ];
    
    // Set up the read-only call to the storage contract
    // We call storage.get-creator-profile because that's where profiles are stored
    const options = {
      network: new StacksTestnet(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: 'storage',  // Calling the storage contract
      functionName: 'get-creator-profile',  // Function name in storage.clar
      functionArgs: functionArgs,
      senderAddress: CONTRACT_CONFIG.address,
    };
    
    // Fetch the profile data from the blockchain
    const result = await callReadOnlyFunction(options);
    
    console.log('Creator profile result:', result);
    
    // Convert the result to JSON format
    const profileData = cvToJSON(result);
    
    // Return the profile data if found
    return profileData;
    
  } catch (error) {
    // Profile doesn't exist or other error occurred
    console.log('No creator profile found:', error.message);
    return null;
  }
};

/**
 * GET PUBLIC USER PROFILE
 * Reads a public user's profile from the blockchain (READ-ONLY)
 * This fetches the full public user profile including username, bio, following count, etc.
 */
export const getPublicUserProfile = async (userAddress) => {
  try {
    console.log('Fetching public user profile for:', userAddress);
    
    // Import required Stacks functions
    const { callReadOnlyFunction, cvToJSON } = await import('@stacks/transactions');
    const { StacksTestnet } = await import('@stacks/network');
    
    // Prepare the function arguments - just the user's wallet address
    const functionArgs = [
      Cl.principal(userAddress)
    ];
    
    // Set up the read-only call to the storage contract
    // We call storage.get-public-user-profile
    const options = {
      network: new StacksTestnet(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: 'storage',  // Calling the storage contract
      functionName: 'get-public-user-profile',  // Function name in storage.clar
      functionArgs: functionArgs,
      senderAddress: CONTRACT_CONFIG.address,
    };
    
    // Fetch the profile data from the blockchain
    const result = await callReadOnlyFunction(options);
    
    console.log('Public user profile result:', result);
    
    // Convert the result to JSON format
    const profileData = cvToJSON(result);
    
    // Return the profile data if found
    return profileData;
    
  } catch (error) {
    // Profile doesn't exist or other error occurred
    console.log('No public user profile found:', error.message);
    return null;
  }
};

/**
 * CREATE PUBLIC USER PROFILE
 * Creates a new public user account on the blockchain
 * Public users can follow creators and send tips, but cannot publish content
 * 
 * @param {string} userAddress - The user's wallet address
 * @param {string} username - Unique username (permanent, cannot be changed)
 * @param {string} displayName - User's display name (can be updated later)
 * @param {string} bio - User's bio/description (can be updated later)
 */
export const createPublicUserProfile = async (userAddress, username, displayName, bio) => {
  try {
    console.log('Creating public user profile...');
    console.log('Username:', username);
    console.log('Display Name:', displayName);
    console.log('Bio:', bio);
    
    // Import Stacks functions dynamically
    const { openContractCall } = await import('@stacks/connect');
    const { AnchorMode, PostConditionMode, stringAsciiCV, stringUtf8CV } = await import('@stacks/transactions');
    
    // Prepare the data in blockchain format
    // These become the parameters for the create-public-user-profile function in main.clar
    const functionArgs = [
      stringAsciiCV(username),      // User's unique username (ASCII string)
      stringUtf8CV(displayName),    // User's display name (UTF-8 string)
      stringUtf8CV(bio)             // User's bio (UTF-8 string)
    ];
    
    // Set up the transaction options
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,  // Main contract
      functionName: 'create-public-user-profile',  // Function in main.clar
      functionArgs: functionArgs,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('Public user profile transaction broadcast:', data);
      },
      onCancel: () => {
        console.log('Transaction cancelled by user');
      }
    };
    
    // Open wallet popup and send transaction
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error creating public user profile:', error);
    throw error;
  }
};

/**
 * UPDATED PUBLISH CONTENT FUNCTION
 * This publishContent function supports IPFS hash
 * 
 * @param {string} userAddress - Who is publishing
 * @param {string} title - Content title
 * @param {string} description - Content description
 * @param {string} contentHash - Hash of the content (for verification)
 * @param {string|null} ipfsHash - IPFS hash where image is stored (optional)
 * @param {number} category - Content category number (1-6)
 */
export const publishContent = async (userAddress, title, description, contentHash, ipfsHash, category) => {
  try {
    console.log('Publishing content...');
    console.log('Title:', title);
    console.log('Category:', category);
    console.log('IPFS Hash:', ipfsHash);
    
    // Import Stacks functions
    const { openContractCall } = await import('@stacks/connect');
    const { 
      AnchorMode, 
      PostConditionMode, 
      stringUtf8CV, 
      bufferCV, 
      someCV, 
      noneCV, 
      uintCV 
    } = await import('@stacks/transactions');
    
    // Convert content hash from hex string to buffer
    // The smart contract expects a buff 32 type
    const hashBuffer = contentHash.startsWith('0x') ? contentHash.slice(2) : contentHash;
    const contentHashBuffer = bufferCV(Buffer.from(hashBuffer, 'hex'));
    
    // Prepare the IPFS hash parameter
    // If ipfsHash is provided, wrap it in someCV(), otherwise use noneCV()
    const ipfsHashParam = ipfsHash ? someCV(stringUtf8CV(ipfsHash)) : noneCV();
    
    // Prepare all the function arguments
    const functionArgs = [
      stringUtf8CV(title),        // Content title
      stringUtf8CV(description),  // Content description
      contentHashBuffer,          // Content hash as buffer
      ipfsHashParam,              // Optional IPFS hash
      uintCV(category)            // Category number
    ];
    
    // Set up transaction
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,  // Main contract
      functionName: 'publish-content',  // Function in main.clar
      functionArgs: functionArgs,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('Content published:', data);
      },
      onCancel: () => {
        console.log('Publishing cancelled');
      }
    };
    
    // Open wallet and send transaction
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error publishing content:', error);
    throw error;
  }
};

// ============================================================
// NFT MARKETPLACE FUNCTIONS 
// ============================================================

/**
 * LIST FASHION NFT FOR SALE
 * This function lets NFT owners list their NFTs on the marketplace
 * Only the owner can list their NFT
 * 
 * @param {uint} tokenId - The NFT ID to list
 * @param {number} priceInSTX - The sale price in STX (will be converted to micro-STX)
 */
export const listFashionNFT = async (tokenId, priceInSTX) => {
  try {
    console.log('Listing NFT for sale...');
    console.log('Token ID:', tokenId);
    console.log('Price:', priceInSTX, 'STX');
    
    // Import Stacks functions
    const { openContractCall } = await import('@stacks/connect');
    const { AnchorMode, PostConditionMode, uintCV } = await import('@stacks/transactions');
    
    // Convert STX to micro-STX (1 STX = 1,000,000 micro-STX)
    const priceInMicroSTX = Math.floor(priceInSTX * 1000000);
    
    // Prepare function arguments
    const functionArgs = [
      uintCV(tokenId),              // NFT token ID
      uintCV(priceInMicroSTX)       // Price in micro-STX
    ];
    
    // Set up transaction
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,  // main contract
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
    
    // Open wallet and send transaction
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error listing NFT:', error);
    throw error;
  }
};

/**
 * PURCHASE FASHION NFT
 * This function lets users buy listed NFTs
 * Platform takes 5% fee, seller gets 95%
 * 
 * @param {uint} tokenId - The NFT ID to purchase
 * @param {number} maxPriceInSTX - Maximum price willing to pay (slippage protection)
 */
export const purchaseFashionNFT = async (tokenId, maxPriceInSTX) => {
  try {
    console.log('Purchasing NFT...');
    console.log('Token ID:', tokenId);
    console.log('Max Price:', maxPriceInSTX, 'STX');
    
    // Import Stacks functions
    const { openContractCall } = await import('@stacks/connect');
    const { AnchorMode, PostConditionMode, uintCV } = await import('@stacks/transactions');
    
    // Convert STX to micro-STX
    const maxPriceInMicroSTX = Math.floor(maxPriceInSTX * 1000000);
    
    // Prepare function arguments
    const functionArgs = [
      uintCV(tokenId),                  // NFT token ID
      uintCV(maxPriceInMicroSTX)        // Maximum acceptable price
    ];
    
    // Set up transaction
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,  // main contract
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
    
    // Open wallet and send transaction
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error purchasing NFT:', error);
    throw error;
  }
};

/**
 * UNLIST FASHION NFT
 * This function removes an NFT from the marketplace
 * only the seller can unlist their NFT
 * 
 * @param {uint} tokenId - The NFT ID to unlist
 */
export const unlistFashionNFT = async (tokenId) => {
  try {
    console.log('Unlisting NFT...');
    console.log('Token ID:', tokenId);
    
    // Import Stacks functions
    const { openContractCall } = await import('@stacks/connect');
    const { AnchorMode, PostConditionMode, uintCV } = await import('@stacks/transactions');
    
    // Prepare function arguments
    const functionArgs = [
      uintCV(tokenId)  // NFT token ID
    ];
    
    // Set up transaction
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,  // main contract
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
    
    // Open wallet and send transaction
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error unlisting NFT:', error);
    throw error;
  }
};

/**
 * GET NFT LISTING
 * Fetch listing details for a specific NFT
 * Returns price, seller, active status
 * 
 * @param {uint} tokenId - The NFT ID to check
 */
export const getNFTListing = async (tokenId) => {
  try {
    console.log('Fetching NFT listing for token:', tokenId);
    
    // Import Stacks functions
    const { callReadOnlyFunction, cvToJSON } = await import('@stacks/transactions');
    const { StacksTestnet } = await import('@stacks/network');
    
    // Prepare function arguments
    const functionArgs = [
      Cl.uint(tokenId)
    ];
    
    // Set up read-only call
    const options = {
      network: new StacksTestnet(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,  // main contract
      functionName: 'get-nft-listing',
      functionArgs: functionArgs,
      senderAddress: CONTRACT_CONFIG.address,
    };
    
    // Fetch listing data
    const result = await callReadOnlyFunction(options);
    const listingData = cvToJSON(result);
    
    console.log('NFT listing data:', listingData);
    return listingData;
    
  } catch (error) {
    console.error('Error fetching NFT listing:', error);
    return null;
  }
};

/**
 * GET MARKETPLACE STATISTICS
 * Fetch overall marketplace stats (total listings, sales, revenue)
 */
export const getMarketplaceStats = async () => {
  try {
    console.log('Fetching marketplace statistics...');
    
    // Import Stacks functions
    const { callReadOnlyFunction, cvToJSON } = await import('@stacks/transactions');
    const { StacksTestnet } = await import('@stacks/network');
    
    // Set up read-only call
    const options = {
      network: new StacksTestnet(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,  // main contract
      functionName: 'get-marketplace-stats',
      functionArgs: [],
      senderAddress: CONTRACT_CONFIG.address,
    };
    
    // Fetch marketplace stats
    const result = await callReadOnlyFunction(options);
    const statsData = cvToJSON(result);
    
    console.log('Marketplace stats:', statsData);
    return statsData;
    
  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    return null;
  }
};

/**
 * CREATE NFT COLLECTION
 * Create a new fashion NFT collection
 * Costs 0.05 sBTC to create
 * 
 * @param {string} collectionName - Name of the collection
 * @param {string} description - Description of the collection
 * @param {number} maxEditions - Maximum number of NFTs in this collection
 */
export const createNFTCollection = async (collectionName, description, maxEditions) => {
  try {
    console.log('Creating NFT collection...');
    console.log('Name:', collectionName);
    console.log('Max Editions:', maxEditions);
    
    // Import Stacks functions
    const { openContractCall } = await import('@stacks/connect');
    const { AnchorMode, PostConditionMode, stringUtf8CV, uintCV } = await import('@stacks/transactions');
    
    // Prepare function arguments
    const functionArgs = [
      stringUtf8CV(collectionName),     // Collection name
      stringUtf8CV(description),        // Collection description
      uintCV(maxEditions)               // Maximum editions
    ];
    
    // Set up transaction
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: CONTRACT_CONFIG.name,  // main contract
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
    
    // Open wallet and send transaction
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
};

/**
 * MINT FASHION NFT
 * Mint a new NFT in an existing collection
 * Only collection creator can mint
 * 
 * @param {uint} collectionId - Which collection to mint in
 * @param {string} recipientAddress - Who receives the NFT
 * @param {string} name - NFT name
 * @param {string} description - NFT description
 * @param {string} imageIpfsHash - IPFS hash of the image
 */
export const mintFashionNFT = async (collectionId, recipientAddress, name, description, imageIpfsHash) => {
  try {
    console.log('Minting NFT...');
    console.log('Collection ID:', collectionId);
    console.log('Name:', name);
    
    // Import Stacks functions
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
    
    // Prepare function arguments
    const functionArgs = [
      uintCV(collectionId),                     // Collection ID
      principalCV(recipientAddress),            // Recipient address
      stringUtf8CV(name),                       // NFT name
      stringUtf8CV(description),                // NFT description
      stringAsciiCV(imageIpfsHash),             // IPFS hash for image
      noneCV(),                                 // animation-ipfs-hash (optional, using none)
      noneCV(),                                 // external-url (optional, using none)
      noneCV()                                  // attributes-ipfs-hash (optional, using none)
    ];
    
    // Set up transaction
    const txOptions = {
      network: getNetwork(),
      contractAddress: CONTRACT_CONFIG.address,
      contractName: 'glamora-nft',  // NFT contract
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
    
    // Open wallet and send transaction
    await openContractCall(txOptions);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error minting NFT:', error);
    throw error;
  }
};

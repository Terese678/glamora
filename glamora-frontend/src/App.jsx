// This is the Main Application File for Glamora
// it manages wallet connection, user profiles (creator/public), content publishing, 
// NFT marketplace, and tipping system on Stacks blockchain with sBTC
import IpfsUploader from './IpfsUploader';

import React, { useState, useEffect } from 'react';
import './App.css';
import WalletConnect from './WalletConnect';
import Profile from './Profile';
import * as contractCalls from './contractCalls';

function App() {
  // State variables: they store information that changes as users interact
  // its used to keep track of what's happening in the app
  
  const [userAddress, setUserAddress] = useState(null); // Stores the connected wallet address
  const [currentView, setCurrentView] = useState('home'); // Which page the user is viewing
  const [userProfile, setUserProfile] = useState(null); // The user's profile info
  const [isCreator, setIsCreator] = useState(false); // Is this user a creator or regular user?
  
  // Profile type selection for signup
  const [profileType, setProfileType] = useState(null); // null, 'creator', or 'public-user'
  
  // Form states, these track what users type into forms
  const [creatorName, setCreatorName] = useState('');
  const [username, setUsername] = useState(''); // For public user username
  const [displayName, setDisplayName] = useState(''); // For public user display name
  const [bio, setBio] = useState('');
  const [creatorContent, setCreatorContent] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [contentTitle, setContentTitle] = useState('');
  const [contentDescription, setContentDescription] = useState('');
  const [contentCategory, setContentCategory] = useState('Fashion');
  const [contentHash, setContentHash] = useState(''); // For content verification
  const [ipfsHash, setIpfsHash] = useState(''); // For IPFS image storage
  const [tipAmount, setTipAmount] = useState('');
  const [tipRecipient, setTipRecipient] = useState('');
  
  // NFT Marketplace states
  const [marketplaceTab, setMarketplaceTab] = useState('browse'); // which marketplace tab is active
  const [browseTokenId, setBrowseTokenId] = useState(''); // token ID for browsing
  const [nftDetails, setNftDetails] = useState(null); // stores NFT details
  const [maxBuyPrice, setMaxBuyPrice] = useState(''); // maximum price for buying
  
  // Collection creation states
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [maxEditions, setMaxEditions] = useState('');
  
  // NFT minting states
  const [mintCollectionId, setMintCollectionId] = useState('');
  const [mintRecipient, setMintRecipient] = useState('');
  const [mintNftName, setMintNftName] = useState('');
  const [mintNftDescription, setMintNftDescription] = useState('');
  const [mintIpfsHash, setMintIpfsHash] = useState('');
  
  // NFT listing states
  const [listTokenId, setListTokenId] = useState('');
  const [listPrice, setListPrice] = useState('');
  const [unlistTokenId, setUnlistTokenId] = useState('');
  
  // Loading and message states
  const [loading, setLoading] = useState(false); // Shows loading spinners when true
  const [message, setMessage] = useState(''); // Displays success or error messages

  // Handle browser back/forward buttons
  useEffect(() => {
    // This function runs when user clicks browser back/forward
    const handlePopState = (event) => {
      // Get the view from browser history state
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
        setProfileType(event.state.profileType || null);
      }
    };

    // Listen for browser back/forward button clicks
    window.addEventListener('popstate', handlePopState);

    // Initial state - set the current view in browser history
    window.history.replaceState({ view: currentView, profileType: profileType }, '');

    // Cleanup - remove listener when component unmounts
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentView, profileType]);

  // Create a navigation helper function
  const navigateTo = (view, resetProfileType = false) => {
    setCurrentView(view);
    if (resetProfileType) {
      setProfileType(null);
    }
    
    // Push new state to browser history so back button works
    window.history.pushState(
      { view: view, profileType: resetProfileType ? null : profileType }, 
      '', 
      `#${view}`
    );
  };

  // Handle profile updates from Profile component
  // This function receives updated profile data from the Profile page
  // and updates the app's state so changes appear everywhere
  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(updatedProfile);
  };

  // Create a go back function
  const goBack = () => {
    window.history.back();
  };

  // This function runs whenever a wallet connects
  // It receives the full user data object from WalletConnect
  const handleWalletConnect = async (userData) => {
    if (userData && userData.profile && userData.profile.stxAddress) {
      const address = userData.profile.stxAddress.testnet;
      setUserAddress(address);
      await loadUserProfile(address);
    } else {
      // Wallet disconnected
      setUserAddress(null);
      setUserProfile(null);
      setIsCreator(false);
      setProfileType(null); // Reset profile type selection
    }
  };

// Load the user's profile from the blockchain
// This function checks both creator and public user profiles
// It properly validates that a profile exists before setting state
const loadUserProfile = async (address) => {
  try {
    setLoading(true);
    
    // First, try to load as a creator profile
    const creatorProfile = await contractCalls.getCreatorProfile(address);
    
    console.log('Creator profile check result:', creatorProfile);

  // Check if it's a VALID creator profile (check for any non-empty property)
  if (creatorProfile && typeof creatorProfile === 'object' && Object.keys(creatorProfile).length > 0 && (creatorProfile.username || creatorProfile.displayName || creatorProfile.bio)) {
    console.log('Found valid creator profile');
    console.log('Profile data:', creatorProfile);
    setUserProfile(creatorProfile);
    setIsCreator(true);
    loadCreatorContent(address);
    return;
  }
    
    console.log('No creator profile, checking public user...');
    
    const publicProfile = await contractCalls.getPublicUserProfile(address);
    console.log("Public user profile check result:", publicProfile);

    if (publicProfile && typeof publicProfile === 'object' && Object.keys(publicProfile).length > 0) {  
      console.log("Public user profile found!");
      setUserProfile(publicProfile);
      setIsCreator(false);
      return;  
    }
    
    // No profile found at all
    console.log('No profile found - user needs to create one');
    setUserProfile(null);
    setIsCreator(false);
    
  } catch (error) {
    console.error('Error loading profile:', error);
    setUserProfile(null);
    setIsCreator(false);
  } finally {
    setLoading(false);
  }
};

// Load creator's published content
const loadCreatorContent = async (address) => {
  if (!address) return;
  
  try {
    setLoadingContent(true);
    console.log('Loading content for creator:', address);
    const content = await contractCalls.getCreatorContent(address);
    console.log('Content loaded:', content);
    setCreatorContent(content);
  } catch (error) {
    console.error('Error loading content:', error);
    setCreatorContent([]);
  } finally {
    setLoadingContent(false);
  }
};

  // Create a creator profile when the form is submitted
const handleCreateCreatorProfile = async (e) => {
  e.preventDefault(); // Stops the page from refreshing
  
  if (!userAddress) {
    setMessage('Please connect your wallet first');
    return;
  }

  try {
    setLoading(true);
    setMessage('Creating your creator profile...');
    
    // Call the smart contract to create the profile
    // Creator profiles need: username (creator name), display name, and bio
    await contractCalls.createCreatorProfile(
      userAddress,
      creatorName, // This becomes the username in the contract
      creatorName, // This becomes the display name (same as username for creators)
      bio
    );
    
    setMessage(' Profile transaction submitted! Waiting for blockchain confirmation...');
    
    // Poll for profile confirmation with better timing
    let attempts = 0;
    const maxAttempts = 20; // Try for 100 seconds (20 attempts × 5 seconds each)
    
    const checkProfile = setInterval(async () => {
      attempts++;
      console.log(`Checking for creator profile... Attempt ${attempts}/${maxAttempts}`);
      
      try {
        // Try to fetch the newly created profile from the blockchain
        const profile = await contractCalls.getCreatorProfile(userAddress);
        
        if (profile && profile.type !== 'none') {
          // Profile found! Stop checking and update the UI
          clearInterval(checkProfile);
          setUserProfile(profile);
          setIsCreator(true);
          setMessage('Creator profile created successfully! Welcome to Glamora!');
          setLoading(false);
          
          // Clear the form fields
          setCreatorName('');
          setBio('');
          setProfileType(null);
          
          // Auto-navigate to home after 2 seconds
          setTimeout(() => {
            navigateTo('home', true);
            setMessage(''); // Clear message after navigation
          }, 2000);
          
        } else if (attempts >= maxAttempts) {
          // Max attempts reached, but profile might still be processing
          clearInterval(checkProfile);
          setMessage('Profile created! Blockchain confirmation is taking longer than usual. Refreshing page...');
          
          // Auto-refresh the page after 3 seconds
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          // Still waiting... update message with countdown
          const secondsLeft = (maxAttempts - attempts) * 5;
          setMessage(`Waiting for blockchain confirmation... (${secondsLeft}s remaining)`);
        }
      } catch (error) {
        console.log('Error checking profile:', error);
        // Don't stop polling on errors, just continue
      }
    }, 5000); // Check every 5 seconds
    
  } catch (error) {
    // Handle any errors that occur during profile creation
    console.error('Error creating profile:', error);
    setMessage('Error creating profile: ' + error.message);
    setLoading(false);
  }
};

  // Create a public user profile when the form is submitted
const handleCreatePublicUserProfile = async (e) => {
  e.preventDefault(); // Stops the page from refreshing
  
  if (!userAddress) {
    setMessage('Please connect your wallet first');
    return;
  }

  try {
    setLoading(true);
    setMessage('Creating your public user profile...');
    
    // Call the smart contract to create the public user profile
    // Public users need: username, display name, and bio
    const result = await contractCalls.createPublicUserProfile(
      userAddress,
      username,
      displayName,
      bio
    );
    
    setMessage('Profile transaction submitted! Waiting for blockchain confirmation...');
    
    // Poll for profile confirmation with better timing
    let attempts = 0;
    const maxAttempts = 20; // Try for 100 seconds
    
    const checkProfile = setInterval(async () => {
      attempts++;
      console.log(`Checking for public user profile... Attempt ${attempts}/${maxAttempts}`);
      
      try {
        // Try to fetch the newly created profile from the blockchain
        const profile = await contractCalls.getPublicUserProfile(userAddress);
        
        if (profile && profile.type !== 'none') {
          //Profile found! Stop checking and update the UI
          clearInterval(checkProfile);
          setUserProfile(profile);
          setIsCreator(false);
          setMessage('Public user profile created successfully! Welcome to Glamora!');
          setLoading(false);
          
          // Clear the form fields
          setUsername('');
          setDisplayName('');
          setBio('');
          setProfileType(null);
          
          // Auto-navigate to home after 2 seconds
          setTimeout(() => {
            navigateTo('home', true);
            setMessage('');
          }, 2000);
          
        } else if (attempts >= maxAttempts) {
          //  Max attempts reached
          clearInterval(checkProfile);
          setMessage('Profile created! Blockchain confirmation is taking longer than usual. Refreshing page...');
          
          // Auto-refresh the page after 3 seconds
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          // Still waiting... update message with countdown
          const secondsLeft = (maxAttempts - attempts) * 5;
          setMessage(`Waiting for blockchain confirmation... (${secondsLeft}s remaining)`);
        }
      } catch (error) {
        console.log('Error checking profile:', error);
        // Don't stop polling on errors, just continue
      }
    }, 5000); // Check every 5 seconds
    
  } catch (error) {
    // Handle any errors that occur during profile creation
    console.error('Error creating profile:', error);
    setMessage(' Error creating profile: ' + error.message);
    setLoading(false);
  }
};

  // Publish new fashion content
  // Now supports IPFS hash for storing images
  const handlePublishContent = async (e) => {
    e.preventDefault();
    
    if (!userAddress || !isCreator) {
      setMessage('Only creators can publish content. Create a creator profile first!');
      return;
    }

    try {
      setLoading(true);
      setMessage('Publishing your content...');
      
      // Generate a content hash for verification
      // In production, this should be a proper hash of the content
      const generatedHash = '0x' + Math.random().toString(16).substr(2, 64);
      
      // Convert category name to category number (1-6)
      const categoryMap = {
        'Fashion': 1,
        'Streetwear': 2,
        'HighFashion': 3,
        'Accessories': 4,
        'Footwear': 5,
        'Lifestyle': 6
      };
      const categoryNumber = categoryMap[contentCategory] || 1;
      
      // Call the smart contract to publish content
      // Now includes IPFS hash for image storage
      const result = await contractCalls.publishContent(
        userAddress,
        contentTitle,
        contentDescription,
        generatedHash,
        ipfsHash || null, // Use null if no IPFS hash provided
        categoryNumber
      );
      
      setMessage('Content published successfully! Check your wallet for the transaction.');
      
      // Clear the form
      setContentTitle('');
      setContentDescription('');
      setIpfsHash('');
    } catch (error) {
      setMessage('Error publishing content: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Send a tip to a creator
  const handleTipCreator = async (e) => {
    e.preventDefault();
    
    if (!userAddress) {
      setMessage('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setMessage('Sending tip...');
      
      // Convert the tip amount to the smallest unit (like converting dollars to cents)
      const amountInMicroBTC = parseFloat(tipAmount) * 1000000;
      
      // Call the smart contract to send the tip
      const result = await contractCalls.tipCreator(
        userAddress,
        tipRecipient,
        amountInMicroBTC
      );
      
      setMessage('Tip sent successfully! Check your wallet for the transaction.');
      
      // Clear the form
      setTipAmount('');
      setTipRecipient('');
    } catch (error) {
      setMessage('Error sending tip: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // NFT MARKETPLACE HANDLER FUNCTIONS
  // ============================================================

  // View NFT details
  const handleViewNFT = async () => {
    if (!browseTokenId) {
      setMessage('Please enter an NFT Token ID');
      return;
    }

    try {
      setLoading(true);
      setMessage('Fetching NFT details...');
      
      const listing = await contractCalls.getNFTListing(parseInt(browseTokenId));
      
      setNftDetails({
        listing: listing
      });
      
      setMessage('NFT details loaded');
    } catch (error) {
      setMessage('Error fetching NFT: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Buy NFT
  const handleBuyNFT = async (tokenId, maxPrice) => {
    try {
      setLoading(true);
      setMessage('Processing purchase...');
      
      await contractCalls.purchaseFashionNFT(parseInt(tokenId), parseFloat(maxPrice));
      
      setMessage('NFT purchase initiated! Check your wallet.');
    } catch (error) {
      setMessage('Error purchasing NFT: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create NFT Collection
  const handleCreateCollection = async (e) => {
    e.preventDefault();
    
    if (!userAddress || !isCreator) {
      setMessage('Only creators can create NFT collections');
      return;
    }

    try {
      setLoading(true);
      setMessage('Creating collection...');
      
      await contractCalls.createNFTCollection(
        collectionName,
        collectionDescription,
        parseInt(maxEditions)
      );
      
      setMessage('Collection created! Check your wallet. Fee: 0.05 sBTC');
      
      // Clear form
      setCollectionName('');
      setCollectionDescription('');
      setMaxEditions('');
    } catch (error) {
      setMessage('Error creating collection: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Mint NFT
  const handleMintNFT = async (e) => {
    e.preventDefault();
    
    if (!userAddress || !isCreator) {
      setMessage('Only creators can mint NFTs');
      return;
    }

    if (!mintIpfsHash) {
      setMessage('Please upload an image or provide IPFS hash');
      return;
    }

    try {
      setLoading(true);
      setMessage('Minting NFT...');
      
      await contractCalls.mintFashionNFT(
        parseInt(mintCollectionId),
        mintRecipient,
        mintNftName,
        mintNftDescription,
        mintIpfsHash
      );
      
      setMessage('NFT minted successfully! Check your wallet.');
      
      // Clear form
      setMintCollectionId('');
      setMintRecipient('');
      setMintNftName('');
      setMintNftDescription('');
      setMintIpfsHash('');
    } catch (error) {
      setMessage('Error minting NFT: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // List NFT for sale
  const handleListNFT = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage('Listing NFT for sale...');
      
      await contractCalls.listFashionNFT(
        parseInt(listTokenId),
        parseFloat(listPrice)
      );
      
      setMessage('NFT listed successfully!');
      
      // Clear form
      setListTokenId('');
      setListPrice('');
    } catch (error) {
      setMessage('Error listing NFT: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Unlist NFT
  const handleUnlistNFT = async () => {
    if (!unlistTokenId) {
      setMessage('Please enter a Token ID');
      return;
    }

    try {
      setLoading(true);
      setMessage('Unlisting NFT...');
      
      await contractCalls.unlistFashionNFT(parseInt(unlistTokenId));
      
      setMessage('NFT unlisted successfully!');
      setUnlistTokenId('');
    } catch (error) {
      setMessage('Error unlisting NFT: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get IPFS image URL
  // This converts an IPFS hash to a viewable URL
  const getIpfsUrl = (hash) => {
    if (!hash) return null;
    // Remove 'ipfs://' prefix if present
    const cleanHash = hash.replace('ipfs://', '');
    // Use Pinata gateway or public IPFS gateway
    return `https://gateway.pinata.cloud/ipfs/${cleanHash}`;
    // Alternative: return `https://ipfs.io/ipfs/${cleanHash}`;
  };

  // This is what gets displayed on the screen
  return (
    <div className="App">
      {/* Header Section */}
      <header className="app-header">
        <h1>Glamora</h1>
        <p>Fashion Content Platform on Bitcoin</p>
        
        <WalletConnect onUserUpdate={handleWalletConnect} />
      </header>

      {/* Navigation Menu */}
      <nav className="navigation">
        <button onClick={() => navigateTo('home', true)}>Home</button>
        {userAddress && userProfile && (
          <button onClick={() => navigateTo('profile', true)}>My Profile</button>
        )}
        {userAddress && !userProfile && (
          <button onClick={() => navigateTo('profile', false)}>Create Profile</button>
        )}
        {userAddress && userProfile && userProfile.type !== 'none' && isCreator && (
          <button onClick={() => navigateTo('create')}>Publish Content</button>
        )}
        <button onClick={() => navigateTo('marketplace')}>Marketplace</button>
        <button onClick={() => navigateTo('tip')}>Send Tip</button>
      </nav>

      {/* Main Content Area - Changes based on which button was clicked */}
      <main className="main-content">
        
        {/* Show message if there is one */}
        {message && (
          <div className="message-box">
            <p>{message}</p>
            <button onClick={() => setMessage('')}>Close</button>
          </div>
        )}

        {/* Show loading spinner when processing */}
        {loading && <div className="loading">Processing...</div>}

        {/* HOME VIEW */}
        {currentView === 'home' && (
          <div className="view">
            <h2>Welcome to Glamora</h2>
            <p>Connect your wallet to get started!</p>
            
            {userAddress && (
              <div className="user-info">
                <p>Connected Address: {userAddress}</p>
                {userProfile ? (
                  <div>
                    <p>Profile Type: {isCreator ? 'Creator' : 'Public User'}</p>
                    {isCreator && userProfile.name && <p>Creator Name: {userProfile.name}</p>}
                    {!isCreator && userProfile.username && <p>Username: {userProfile.username}</p>}
                  </div>
                ) : (
                  <p>No profile found. Create one in the Profile section!</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* PROFILE VIEW - For users with existing profiles */}
        {currentView === 'profile' && userProfile && (
          <Profile 
            userAddress={userAddress}
            userProfile={userProfile}
            isCreator={isCreator}
            onProfileUpdate={handleProfileUpdate}
            creatorContent={creatorContent}
            loadingContent={loadingContent}
          />
        )}

        {/* PROFILE CREATION VIEW - For users without profiles */}
        {currentView === 'profile' && !userProfile && (
          <div className="view">
            <h2>My Profile</h2>
            
            {!userAddress ? (
              <p>Please connect your wallet to view your profile</p>
            ) : (
              <div className="signup-container">
                
                {/* Step 1: Choose profile type */}
                {!profileType ? (
                  <div className="profile-type-selector">
                    <h3>Choose Your Profile Type</h3>
                    <p>Select how you want to join Glamora:</p>
                    
                    <div className="type-buttons">
                      <button 
                        onClick={() => setProfileType('creator')}
                        className="type-button"
                      >
                        <h4>Creator Account</h4>
                        <p>Share fashion content, build followers, earn tips</p>
                      </button>
                      
                      <button 
                        onClick={() => setProfileType('public-user')}
                        className="type-button"
                      >
                        <h4>Public User Account</h4>
                        <p>Follow creators, discover trends, send tips</p>
                      </button>
                    </div>
                    
                    {/* Information section explaining the differences */}
                    <div className="info-section">
                      <h3>What's the difference?</h3>
                      
                      <div className="profile-comparison">
                        <div className="comparison-column">
                          <h4>Creator Account Can:</h4>
                          <ul>
                            <li>Publish fashion content</li>
                            <li>Build a follower base</li>
                            <li>Receive tips from fans</li>
                            <li>Showcase your fashion work</li>
                          </ul>
                        </div>
                        
                        <div className="comparison-column">
                          <h4>Public User Account Can:</h4>
                          <ul>
                            <li>Follow your favorite creators</li>
                            <li>Discover fashion trends</li>
                            <li>Send tips to creators</li>
                            <li>Engage with the community</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : profileType === 'creator' ? (
                  // Step 2a: Show creator signup form
                  <div className="form-container">
                    <button 
                      onClick={goBack} 
                      className="back-button"
                    >
                      ← Back to Profile Selection
                    </button>
                    
                    <h3>Create Creator Profile</h3>
                    <p className="form-description">
                      As a creator, you can publish fashion content and earn tips from your followers.
                    </p>
                    
                    <form onSubmit={handleCreateCreatorProfile}>
                      <div className="form-group">
                        <label>Creator Name:</label>
                        <input
                          type="text"
                          value={creatorName}
                          onChange={(e) => setCreatorName(e.target.value)}
                          required
                          placeholder="Your creator name"
                          maxLength="32"
                        />
                        <small>This will be your unique identifier on Glamora</small>
                      </div>
                      
                      <div className="form-group">
                        <label>Bio:</label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          required
                          placeholder="Tell people about yourself and your fashion style"
                          rows="4"
                          maxLength="256"
                        />
                        <small>Share your fashion philosophy and what you create</small>
                      </div>
                      
                      <button type="submit" disabled={loading}>
                        Create Creator Profile
                      </button>
                    </form>
                  </div>
                ) : (
                  // Step 2b: Show public user signup form
                  <div className="form-container">
                    <button 
                      onClick={goBack} 
                      className="back-button"
                    >
                      ← Back to Profile Selection
                    </button>
                    
                    <h3>Create Public User Profile</h3>
                    <p className="form-description">
                      As a public user, you can follow creators, discover trends, and support your favorites.
                    </p>
                    
                    <form onSubmit={handleCreatePublicUserProfile}>
                      <div className="form-group">
                        <label>Username:</label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          placeholder="Your unique username"
                          maxLength="32"
                        />
                        <small>This is your permanent username and cannot be changed</small>
                      </div>
                      
                      <div className="form-group">
                        <label>Display Name:</label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          required
                          placeholder="Your display name"
                          maxLength="32"
                        />
                        <small>This is how your name appears to others</small>
                      </div>
                      
                      <div className="form-group">
                        <label>Bio:</label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          required
                          placeholder="Tell us about your fashion interests"
                          rows="4"
                          maxLength="256"
                        />
                        <small>Share what kind of fashion content you love</small>
                      </div>
                      
                      <button type="submit" disabled={loading}>
                        Create Public User Profile
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* CREATE CONTENT VIEW */}
        {currentView === 'create' && (
          <div className="view">
            <h2>Publish Fashion Content</h2>
            
            {!userAddress ? (
              <p>Please connect your wallet first</p>
            ) : !userProfile ? (
              <p>Please create a profile first in the Profile section</p>
            ) : !isCreator ? (
              <div>
                <p>Only creator accounts can publish content.</p>
                <p>You have a public user account. To publish content, you'll need to create a creator account.</p>
              </div>
            ) : (
              <div className="form-container">
                <form onSubmit={handlePublishContent}>
                  <div className="form-group">
                    <label>Content Title:</label>
                    <input
                      type="text"
                      value={contentTitle}
                      onChange={(e) => setContentTitle(e.target.value)}
                      required
                      placeholder="Give your content a catchy title"
                      maxLength="100"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Description:</label>
                    <textarea
                      value={contentDescription}
                      onChange={(e) => setContentDescription(e.target.value)}
                      required
                      placeholder="Describe your fashion content in detail"
                      rows="4"
                      maxLength="500"
                    />
                  </div>
                  
                  {/* IPFS Uploader Component */}
                  <IpfsUploader onUploadComplete={(hash) => setIpfsHash(hash)} />

                  {/* Optional: Manual IPFS hash input as fallback */}
                  <div className="form-group">
                   <label>Or paste IPFS Hash manually:</label>
                   <input
                     type="text"
                     value={ipfsHash}
                     onChange={(e) => setIpfsHash(e.target.value)}
                     placeholder="QmXxx..."
                    />
                    <small>If you already have an IPFS hash, paste it here</small>
                  </div>

                  <div className="form-group">
                    <label>Category:</label>
                    <select 
                      value={contentCategory}
                      onChange={(e) => setContentCategory(e.target.value)}
                    >
                      <option value="Fashion">Fashion</option>
                      <option value="Streetwear">Streetwear</option>
                      <option value="HighFashion">High Fashion</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Footwear">Footwear</option>
                      <option value="Lifestyle">Lifestyle</option>
                    </select>
                    <small>Choose the category that best fits your content</small>
                  </div>
                  
                  <button type="submit" disabled={loading}>
                    Publish Content
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TIP CREATOR VIEW */}
        {currentView === 'tip' && (
          <div className="view">
            <h2>Send a Tip</h2>
            
            {!userAddress ? (
              <p>Please connect your wallet first</p>
            ) : !userProfile ? (
              <p>Please create a profile first in the Profile section</p>
            ) : (
              <div className="form-container">
                <p className="form-description">
                  Support your favorite creators by sending them tips in sBTC.
                </p>
                
                <form onSubmit={handleTipCreator}>
                  <div className="form-group">
                    <label>Creator Address:</label>
                    <input
                      type="text"
                      value={tipRecipient}
                      onChange={(e) => setTipRecipient(e.target.value)}
                      required
                      placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
                    />
                    <small>Enter the Stacks address of the creator you want to tip</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Amount (in sBTC):</label>
                    <input
                      type="number"
                      step="0.000001"
                      min="0.000001"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      required
                      placeholder="0.001"
                    />
                    <small>Minimum tip amount is 0.000001 sBTC</small>
                  </div>
                  
                  <button type="submit" disabled={loading}>
                    Send Tip
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* NFT MARKETPLACE VIEW */}
        {currentView === 'marketplace' && (
          <div className="view">
            <h2>NFT Marketplace</h2>
            
            {!userAddress ? (
              <p>Please connect your wallet to access the marketplace</p>
            ) : !userProfile ? (
              <p>Please create a profile first in the Profile section</p>
            ) : (
              <div className="marketplace-container">
                
                {/* Marketplace Tabs */}
                <div className="marketplace-tabs">
                  <button 
                    onClick={() => setMarketplaceTab('browse')}
                    className={marketplaceTab === 'browse' ? 'tab-active' : ''}
                  >
                    Browse NFTs
                  </button>
                  <button 
                    onClick={() => setMarketplaceTab('create')}
                    className={marketplaceTab === 'create' ? 'tab-active' : ''}
                  >
                    Create Collection
                  </button>
                  <button 
                    onClick={() => setMarketplaceTab('mint')}
                    className={marketplaceTab === 'mint' ? 'tab-active' : ''}
                  >
                    Mint NFT
                  </button>
                  <button 
                    onClick={() => setMarketplaceTab('list')}
                    className={marketplaceTab === 'list' ? 'tab-active' : ''}
                  >
                    List NFT
                  </button>
                </div>

                {/* Browse NFTs Tab */}
                {marketplaceTab === 'browse' && (
                  <div className="marketplace-section">
                    <h3>Browse NFTs for Sale</h3>
                    <p className="section-description">
                      Explore and purchase fashion NFTs from creators around the world.
                    </p>
                    
                    <div className="nft-browse-form">
                      <div className="form-group">
                        <label>Enter NFT Token ID to View:</label>
                        <input
                          type="number"
                          value={browseTokenId}
                          onChange={(e) => setBrowseTokenId(e.target.value)}
                          placeholder="Enter NFT ID (e.g., 1)"
                        />
                      </div>
                      
                      <button 
                        onClick={handleViewNFT}
                        disabled={loading || !browseTokenId}
                      >
                        View NFT Details
                      </button>
                    </div>

                    {/* NFT Details Display */}
                    {nftDetails && (
                      <div className="nft-details-card">
                        <h4>NFT #{browseTokenId}</h4>
                        
                        {nftDetails.listing && (
                          <div className="nft-listing-info">
                            <p><strong>Status:</strong> {nftDetails.listing.active ? 'For Sale' : 'Not Listed'}</p>
                            {nftDetails.listing.active && (
                              <>
                                <p><strong>Price:</strong> {nftDetails.listing.price / 1000000} STX</p>
                                <p><strong>Seller:</strong> {nftDetails.listing.seller}</p>
                                
                                <div className="form-group">
                                  <label>Maximum Price You'll Pay (STX):</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={maxBuyPrice}
                                    onChange={(e) => setMaxBuyPrice(e.target.value)}
                                    placeholder={(nftDetails.listing.price / 1000000 * 1.05).toFixed(2)}
                                  />
                                  <small>Protects you from sudden price increases (suggested: +5% buffer)</small>
                                </div>
                                
                                <button
                                  onClick={() => handleBuyNFT(browseTokenId, maxBuyPrice || (nftDetails.listing.price / 1000000 * 1.05))}
                                  disabled={loading}
                                  className="buy-button"
                                >
                                  Buy This NFT
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Create Collection Tab */}
                {marketplaceTab === 'create' && (
                  <div className="marketplace-section">
                    <h3>Create NFT Collection</h3>
                    <p className="section-description">
                      Start your own fashion NFT collection. Cost: 0.05 sBTC (one-time fee)
                    </p>
                    
                    {!isCreator ? (
                      <p className="error-text">Only creator accounts can create NFT collections.</p>
                    ) : (
                      <form onSubmit={handleCreateCollection} className="form-container">
                        <div className="form-group">
                          <label>Collection Name:</label>
                          <input
                            type="text"
                            value={collectionName}
                            onChange={(e) => setCollectionName(e.target.value)}
                            required
                            placeholder="e.g., Summer 2024 Collection"
                            maxLength="32"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Description:</label>
                          <textarea
                            value={collectionDescription}
                            onChange={(e) => setCollectionDescription(e.target.value)}
                            required
                            placeholder="Describe your collection"
                            rows="4"
                            maxLength="256"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Maximum Editions:</label>
                          <input
                            type="number"
                            value={maxEditions}
                            onChange={(e) => setMaxEditions(e.target.value)}
                            required
                            min="1"
                            max="10000"
                            placeholder="How many NFTs can this collection hold?"
                          />
                          <small>Minimum: 1, Maximum: 10,000</small>
                        </div>
                        
                        <button type="submit" disabled={loading}>
                          Create Collection (0.05 sBTC)
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* Mint NFT Tab */}
                {marketplaceTab === 'mint' && (
                  <div className="marketplace-section">
                    <h3>Mint Fashion NFT</h3>
                    <p className="section-description">
                      Create a new NFT in your collection with IPFS image.
                    </p>
                    
                    {!isCreator ? (
                      <p className="error-text">Only creator accounts can mint NFTs.</p>
                    ) : (
                      <form onSubmit={handleMintNFT} className="form-container">
                        <div className="form-group">
                          <label>Collection ID:</label>
                          <input
                            type="number"
                            value={mintCollectionId}
                            onChange={(e) => setMintCollectionId(e.target.value)}
                            required
                            placeholder="Which collection? (e.g., 1)"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>Recipient Address:</label>
                          <input
                            type="text"
                            value={mintRecipient}
                            onChange={(e) => setMintRecipient(e.target.value)}
                            required
                            placeholder="ST..."
                          />
                          <small>Who will receive this NFT</small>
                        </div>
                        
                        <div className="form-group">
                          <label>NFT Name:</label>
                          <input
                            type="text"
                            value={mintNftName}
                            onChange={(e) => setMintNftName(e.target.value)}
                            required
                            placeholder="e.g., Golden Sunset Dress"
                            maxLength="64"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label>NFT Description:</label>
                          <textarea
                            value={mintNftDescription}
                            onChange={(e) => setMintNftDescription(e.target.value)}
                            required
                            placeholder="Describe this NFT"
                            rows="4"
                            maxLength="256"
                          />
                        </div>
                        
                        <IpfsUploader onUploadComplete={(hash) => setMintIpfsHash(hash)} />
                        
                        <div className="form-group">
                          <label>Or paste IPFS Hash manually:</label>
                          <input
                            type="text"
                            value={mintIpfsHash}
                            onChange={(e) => setMintIpfsHash(e.target.value)}
                            placeholder="QmXxx..."
                          />
                        </div>
                        
                        <button type="submit" disabled={loading || !mintIpfsHash}>
                          Mint NFT
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* List NFT Tab */}
                {marketplaceTab === 'list' && (
                  <div className="marketplace-section">
                    <h3>List NFT for Sale</h3>
                    <p className="section-description">
                      Put your NFT on the marketplace. Platform fee: 5%
                    </p>
                    
                    <form onSubmit={handleListNFT} className="form-container">
                      <div className="form-group">
                        <label>NFT Token ID:</label>
                        <input
                          type="number"
                          value={listTokenId}
                          onChange={(e) => setListTokenId(e.target.value)}
                          required
                          placeholder="Which NFT do you want to sell?"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Sale Price (in STX):</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={listPrice}
                          onChange={(e) => setListPrice(e.target.value)}
                          required
                          placeholder="Minimum: 0.01 STX"
                        />
                        <small>You'll receive 95% after platform fee</small>
                      </div>
                      
                      <button type="submit" disabled={loading}>
                        List NFT for Sale
                      </button>
                    </form>
                    
                    <div className="unlist-section">
                      <h4>Unlist NFT</h4>
                      <div className="form-group">
                        <label>Token ID to Unlist:</label>
                        <input
                          type="number"
                          value={unlistTokenId}
                          onChange={(e) => setUnlistTokenId(e.target.value)}
                          placeholder="Which NFT to remove from sale?"
                        />
                      </div>
                      <button
                        onClick={handleUnlistNFT}
                        disabled={loading || !unlistTokenId}
                        className="unlist-button"
                      >
                        Unlist NFT
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Glamora - Built on Stacks with Clarity</p>
      </footer>
    </div>
  );
}

export default App;


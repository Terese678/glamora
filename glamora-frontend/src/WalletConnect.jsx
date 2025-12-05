// WalletConnect.jsx
// This component handles Stacks wallet connection for Glamora
// It allows users to connect their Leather or Hiro wallet to interact with the platform

import React, { useState, useEffect } from 'react';
import { AppConfig, UserSession } from '@stacks/auth';
import { showConnect } from '@stacks/connect';

const WalletConnect = ({ onUserUpdate }) => {
  // State to store user wallet data after connection
  const [userData, setUserData] = useState(null);
  
  // State to show loading status when connecting
  const [isConnecting, setIsConnecting] = useState(false);
  
  // State to track if component has mounted (React 18 compatibility)
  const [mounted, setMounted] = useState(false);

  // Configuration for Stacks authentication
  // store_write: allows saving data
  // publish_data: allows publishing content
  const appConfig = new AppConfig(['store_write', 'publish_data']);
  const userSession = new UserSession({ appConfig });

  // Check if user is already signed in when component loads
  useEffect(() => {
    setMounted(true);
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData();
      setUserData(data);
      if (onUserUpdate) onUserUpdate(data);
    }
  }, []);

  // Function that runs when user clicks Connect Wallet button
  const connectWallet = async () => {
    console.log('Connect wallet button clicked');
    setIsConnecting(true);
    
    try {
      // Show Stacks wallet connection popup
      showConnect({
        appDetails: {
          name: 'Glamora',
          icon: window.location.origin + '/logo.png',
        },
        redirectTo: '/',
        // This runs when wallet connection is successful
        onFinish: () => {
          console.log('Wallet connected successfully');
          const data = userSession.loadUserData();
          setUserData(data);
          if (onUserUpdate) onUserUpdate(data);
          setIsConnecting(false);
        },
        // This runs if user cancels the connection
        onCancel: () => {
          console.log('User cancelled wallet connection');
          setIsConnecting(false);
        },
        userSession,
      });
    } catch (error) {
      // Handle any errors during connection
      console.error('Wallet connection error:', error);
      setIsConnecting(false);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  // Function to disconnect wallet
  const disconnectWallet = () => {
    userSession.signUserOut();
    setUserData(null);
    if (onUserUpdate) onUserUpdate(null);
  };

  // Don't render until component is mounted
  if (!mounted) return null;

  return (
    <div className="wallet-connect-container">
      {!userData ? (
        // Show connect button when wallet is not connected
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="connect-wallet-btn"
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        // Show wallet info and disconnect button when connected
        <div className="wallet-info">
          <span className="wallet-address">
            {userData.profile.stxAddress.testnet.slice(0, 6)}...
            {userData.profile.stxAddress.testnet.slice(-4)}
          </span>
          <button onClick={disconnectWallet} className="disconnect-btn">
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;

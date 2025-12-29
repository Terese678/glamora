import React, { useState, useEffect } from 'react';

const WalletConnect = ({ onUserUpdate }) => {
  const [userData, setUserData] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('glamoraUserData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setUserData(data);
      if (onUserUpdate) onUserUpdate(data);
    }
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // Check for LeatherProvider (new API)
      if (!window.LeatherProvider) {
        alert('Please install Leather wallet extension');
        setIsConnecting(false);
        return;
      }

      // Use the new LeatherProvider API
      const response = await window.LeatherProvider.request('getAddresses');
      
      if (response?.result?.addresses) {
        const stxAddress = response.result.addresses.find(
          a => a.symbol === 'STX'
        );

        if (!stxAddress) {
          alert('No STX address found. Please check your Leather wallet.');
          setIsConnecting(false);
          return;
        }

        const userInfo = {
          profile: {
            stxAddress: {
              testnet: stxAddress.address
            }
          }
        };

        setUserData(userInfo);
        localStorage.setItem('glamoraUserData', JSON.stringify(userInfo));
        if (onUserUpdate) onUserUpdate(userInfo);
        
        console.log('✅ Wallet connected:', stxAddress.address);
      }
    } catch (error) {
      console.error('❌ Wallet connection error:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    localStorage.removeItem('glamoraUserData');
    setUserData(null);
    if (onUserUpdate) onUserUpdate(null);
    console.log('✅ Wallet disconnected');
  };

  return (
    <div className="wallet-connect-container">
      {!userData ? (
        <button onClick={connectWallet} disabled={isConnecting} className="connect-wallet-btn">
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
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
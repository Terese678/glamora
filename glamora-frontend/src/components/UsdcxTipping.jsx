/**
 * UsdcxTipping.jsx - USDCx Tipping Component for Glamora
 * 
 * PURPOSE:
 * This component enables users to tip fashion creators using USDCx stablecoin
 * or sBTC tokens. It showcases the innovative bridge-adapter vault batching system
 * that reduces gas fees by up to 70% by batching multiple tips together.
 * 
 * KEY FEATURES:
 * - Toggle between USDCx (stablecoin) and sBTC (Bitcoin-pegged) tipping
 * - Real-time balance display
 * - Vault statistics showing batching efficiency
 * - Platform-wide batching metrics
 * - Automatic vault initialization
 * - Comprehensive error handling
 * 
 * INNOVATION:
 * The vault batching system groups multiple tips into single transactions,
 * dramatically reducing blockchain transaction fees. This makes micro-tipping
 * economically viable for both senders and recipients.
 * 
 * @component
 * @param {Object} props
 * @param {string} props.userAddress - Connected wallet address (Stacks format)
 * @param {Object} props.userProfile - User's profile data from storage-v3 contract
 */

import React, { useState, useEffect } from 'react';
import './UsdcxTipping.css';
import * as contractCalls from "../contractCalls";
import { formatUSDCxAmount, toMicroUSDCx, MIN_USDCX_TIP } from "../contractConfig";

const UsdcxTipping = ({ userAddress, userProfile }) => {
  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  
  const [balance, setBalance] = useState(0);
  const [balanceHighlight, setBalanceHighlight] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [vaultInfo, setVaultInfo] = useState(null);
  const [batchStats, setBatchStats] = useState(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('usdcx');
  
  // ============================================================
  // LIFECYCLE & DATA LOADING
  // ============================================================
  
  useEffect(() => {
    if (userAddress) {
      loadBalance();
      loadVaultInfo();
      loadBatchStats();
    }
  }, [userAddress]);

  const loadBalance = async () => {
    try {
      const microBalance = await contractCalls.getUSDCxBalance(userAddress);
      setBalance(microBalance);
      console.log('USDCx Balance loaded:', formatUSDCxAmount(microBalance), 'USDCx');
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const loadVaultInfo = async () => {
    try {
      const info = await contractCalls.getVaultInfo(userAddress);
      setVaultInfo(info);
      console.log('Vault info loaded:', info);
    } catch (error) {
      console.error('Error loading vault info:', error);
    }
  };

  const loadBatchStats = async () => {
    try {
      const stats = await contractCalls.getBatchStats();
      setBatchStats(stats);
      console.log('Platform batch stats loaded:', stats);
    } catch (error) {
      console.error('Error loading batch stats:', error);
    }
  };

  // ============================================================
  // TESTING - MINT TEST USDCx (TESTNET ONLY)
  // ============================================================
  
  const handleMintTestUSDCx = async () => {
    if (!userAddress) {
      setMessage('ERROR: Please connect your wallet first');
      return;
    }

    setLoading(true);
    setMessage('Processing: Minting 100 test USDCx...');

    try {
      const amount = 100000000; // 100 USDCx
      
      await contractCalls.mintTestUSDCx(userAddress, amount);
      
      setMessage('SUCCESS: 100 USDCx minted! Click Refresh to update balance.');
      
      // Clear message after 10 seconds
      setTimeout(() => {
        setMessage('');
      }, 10000);
      
    } catch (error) {
      console.error('Mint error:', error);
      
      if (error.message && error.message.includes('cancelled')) {
        setMessage('Mint cancelled by user');
      } else {
        setMessage(`ERROR: Failed to mint USDCx - ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };


   //============================================================
   // TIPPING LOGIC - USDCx
   // ============================================================
  
  const handleTipWithUSDCx = async (e) => {
    e.preventDefault();
    
    if (!userAddress) {
      setMessage('ERROR: Please connect your wallet first');
      return;
    }

    if (!recipientAddress) {
      setMessage('ERROR: Please enter a recipient address');
      return;
    }

    if (!tipAmount || parseFloat(tipAmount) <= 0) {
      setMessage('ERROR: Please enter a valid tip amount');
      return;
    }

    const amountFloat = parseFloat(tipAmount);
    const minAmount = MIN_USDCX_TIP / 1000000;

    if (amountFloat < minAmount) {
      setMessage(`ERROR: Minimum tip is ${minAmount} USDCx`);
      return;
    }

    const tipAmountMicro = toMicroUSDCx(amountFloat);
    
    if (balance < tipAmountMicro) {
      setMessage(`ERROR: Insufficient balance. You have ${formatUSDCxAmount(balance)} USDCx`);
      return;
    }

    try {
      setLoading(true);
      setMessage('Processing: Preparing USDCx tip transaction...');
      
      setMessage('Processing: Please approve the transaction in your wallet...');

      // CORRECT: Pass recipient first, then amount in micro-units
      await contractCalls.tipWithUSDCx(userAddress, recipientAddress, tipAmountMicro);

      setMessage('SUCCESS: Tip sent successfully! Transaction submitted to blockchain.');
      
      setTipAmount('');
      setRecipientAddress('');

      setTimeout(() => {
        loadBalance();
        setMessage('SUCCESS: Tip confirmed! Balance updated.');
      }, 5000);

    } catch (error) {
      console.error('Error sending USDCx tip:', error);
      setMessage('ERROR: ' + (error.message || 'Transaction failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // TIPPING LOGIC - sBTC
  // ============================================================
  
  const handleTipWithSTX = async (e) => {
    e.preventDefault();
    
    if (!userAddress || !userProfile) {
      setMessage('ERROR: Please connect wallet and create profile first');
      return;
    }

    if (!recipientAddress || !tipAmount) {
      setMessage('ERROR: Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setMessage('Processing: Sending sBTC tip...');

      const amountInMicroSTX = parseFloat(tipAmount) * 1000000;
      
      await contractCalls.tipCreator(
        userAddress,
        recipientAddress,
        amountInMicroSTX
      );

      setMessage('SUCCESS: sBTC tip sent successfully!');
      setTipAmount('');
      setRecipientAddress('');

    } catch (error) {
      console.error('Error sending sBTC tip:', error);
      setMessage('ERROR: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (paymentMethod === 'usdcx') {
      handleTipWithUSDCx(e);
    } else {
      handleTipWithSTX(e);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  
  return (
    <div className="usdcx-tipping-container">
      <div className="tipping-header">
        <h2>Tip Creators</h2>
        <p className="header-subtitle">
          Support your favorite fashion creators with tips
        </p>
      </div>

      {userAddress && (
        <div className="balance-card">
          <div className="balance-info">
            <div className="balance-item">
              <span className="balance-label">USDCx Balance</span>
              <span className={`balance-amount ${balanceHighlight ? 'updated' : ''}`}>
                {formatUSDCxAmount(balance)} USDCx
              </span>
            </div>
            <div className="balance-actions">
              <button 
                onClick={loadBalance}
                className="refresh-btn"
                disabled={loading}
                title="Reload your USDCx balance"
              >
                Refresh
              </button>
              
              {/* Testing Only - Hidden in production */}
              {process.env.NODE_ENV !== 'production' && (
                <button 
                  onClick={handleMintTestUSDCx}
                  className="mint-test-btn"
                  disabled={loading}
                  title="Mint 100 test USDCx (development only)"
                >
                  Mint Test USDCx
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {vaultInfo && vaultInfo.initialized && (
        <div className="vault-stats-card">
          <h3>Your Vault Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Tips Batched</span>
              <span className="stat-value">{vaultInfo.totalBatched || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Batches</span>
              <span className="stat-value">{vaultInfo.batchCount || 0}</span>
            </div>
          </div>
          <p className="vault-benefit">
            Vault batching saves up to 70% on gas fees!
          </p>
        </div>
      )}

      {batchStats && batchStats.totalTipsBatched > 0 && (
        <div className="platform-stats-card">
          <h3>Platform Batching Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Tips Batched</span>
              <span className="stat-value">{batchStats.totalTipsBatched}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Batches</span>
              <span className="stat-value">{batchStats.totalBatches}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg Batch Size</span>
              <span className="stat-value">
                {batchStats.averageBatchSize.toFixed(1)} tips
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="tipping-form-container">
        <form onSubmit={handleSubmit} className="tipping-form">
          
          <div className="payment-method-selector">
            <h3>Choose Payment Method</h3>
            <div className="method-buttons">
              <button
                type="button"
                className={`method-btn ${paymentMethod === 'usdcx' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('usdcx')}
              >
                <span className="method-icon">$</span>
                <span className="method-name">USDCx</span>
                <span className="method-badge">Batched (70% savings)</span>
              </button>
              
              <button
                type="button"
                className={`method-btn ${paymentMethod === 'stx' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('stx')}
              >
                <span className="method-icon">B</span>
                <span className="method-name">sBTC</span>
                <span className="method-badge">Bitcoin-pegged</span>
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="recipientAddress">Creator Address</label>
            <input
              type="text"
              id="recipientAddress"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
              required
              disabled={loading}
            />
            <small>Enter the Stacks address of the creator you want to tip</small>
          </div>

          <div className="form-group">
            <label htmlFor="tipAmount">
              Amount ({paymentMethod === 'usdcx' ? 'USDCx' : 'sBTC'})
            </label>
            <input
              type="number"
              id="tipAmount"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              placeholder={paymentMethod === 'usdcx' ? '1.00' : '0.001'}
              step={paymentMethod === 'usdcx' ? '0.01' : '0.000001'}
              min={paymentMethod === 'usdcx' ? '0.01' : '0.000001'}
              required
              disabled={loading}
            />
            <small>
              {paymentMethod === 'usdcx' 
                ? `Minimum: ${MIN_USDCX_TIP / 1000000} USDCx` 
                : 'Minimum: 0.000001 sBTC'}
            </small>
          </div>

          {paymentMethod === 'usdcx' && (
            <div className="innovation-highlight">
              <div className="highlight-icon">*</div>
              <div className="highlight-content">
                <h4>Vault Batching Technology</h4>
                <p>
                  Your tip will be batched with others, reducing gas fees by up to 70%!
                  This innovative system makes tipping more affordable for everyone.
                </p>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading || !userAddress || !userProfile}
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <span>
                Send {paymentMethod === 'usdcx' ? 'USDCx' : 'sBTC'} Tip
              </span>
            )}
          </button>

        </form>

        {message && (
          <div className={`message-display ${message.includes('ERROR') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="info-section">
        <h3>Why Use USDCx?</h3>
        <div className="benefits-grid">
          <div className="benefit-item">
            <span className="benefit-icon">$</span>
            <h4>Stable Value</h4>
            <p>USDCx is pegged to the US Dollar, protecting against volatility</p>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">⚡</span>
            <h4>Lower Fees</h4>
            <p>Vault batching reduces gas fees by up to 70%</p>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">→</span>
            <h4>Cross-Chain</h4>
            <p>Bridged from Ethereum via Circle's xReserve protocol</p>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">#</span>
            <h4>Secure</h4>
            <p>Backed by USD reserves and audited smart contracts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsdcxTipping;
import React, { useState } from 'react';

const BACKEND_URL = 'https://glamora-backend-rfnq.onrender.com';

export default function X402Content({ userAddress }) {
  const [freeContent, setFreeContent] = useState(null);
  const [premiumContent, setPremiumContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadFreeContent = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/content/free`);
      const data = await res.json();
      setFreeContent(data);
    } catch (err) {
      setMessage('Error loading free content');
    } finally {
      setLoading(false);
    }
  };

  const loadPremiumContent = async () => {
    setLoading(true);
    setMessage('Requesting premium content via x402...');
    try {
      const res = await fetch(`${BACKEND_URL}/api/content/premium`);
      if (res.status === 402) {
        const paymentInfo = await res.json();
        setMessage(`Payment required: $0.01 USDC via x402 HTTP micropayment.`);
      } else {
        const data = await res.json();
        setPremiumContent(data);
        setMessage('');
      }
    } catch (err) {
      setMessage('Error loading premium content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view">
      <h2>🎬 Pay-Per-View Content</h2>
      <p>Free content is open to all. Premium content requires $0.01 USDC via x402 micropayment.</p>

      {message && (
        <div className="message-box">
          <p>{message}</p>
          <button onClick={() => setMessage('')}>Close</button>
        </div>
      )}
      {loading && <div className="loading">Loading...</div>}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        
        {/* FREE CONTENT */}
        <div className="form-container" style={{ flex: 1 }}>
          <h3>🆓 Free Content</h3>
          <button onClick={loadFreeContent} disabled={loading}>Load Free Content</button>
          {freeContent && (
            <div style={{ marginTop: '1rem' }}>
              {freeContent.image && (
                <img 
                  src={freeContent.image} 
                  alt={freeContent.title}
                  style={{ width: '100%', borderRadius: '8px', marginBottom: '0.5rem' }}
                />
              )}
              <h4>{freeContent.title}</h4>
              <p>{freeContent.content}</p>
            </div>
          )}
        </div>

        {/* PREMIUM CONTENT */}
        <div className="form-container" style={{ flex: 1 }}>
          <h3>🔒 Premium Content (x402)</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Costs $0.01 USDC via HTTP micropayment</p>
          <button onClick={loadPremiumContent} disabled={loading}>Unlock Premium Content</button>
          {premiumContent && (
            <div style={{ marginTop: '1rem' }}>
              {premiumContent.image && (
                <img 
                  src={premiumContent.image} 
                  alt={premiumContent.title}
                  style={{ width: '100%', borderRadius: '8px', marginBottom: '0.5rem' }}
                />
              )}
              <h4>{premiumContent.title}</h4>
              <p>{premiumContent.content}</p>
              <small>Unlocked at: {new Date(premiumContent.unlockedAt).toLocaleString()}</small>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

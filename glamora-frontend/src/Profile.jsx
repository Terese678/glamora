// Profile.jsx - Displays and manages user profile
// This component shows the user's profile details and allows editing

import React, { useState, useEffect } from 'react';
import './Profile.css';
import * as contractCalls from './contractCalls';

  const Profile = ({ userAddress, userProfile, isCreator, onProfileUpdate, creatorContent, loadingContent }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedDisplayName, setEditedDisplayName] = useState('');
  
  useEffect(() => {
    const profileData = userProfile?.value || userProfile;
    if (profileData) {
      setEditedBio(profileData.bio?.value || profileData.bio || '');
      setEditedDisplayName(profileData['display-name']?.value || profileData.displayName || '');
    }
  }, [userProfile]);
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!userAddress) {
      setMessage('Wallet not connected');
      return;
    }
    try {
      setLoading(true);
      setMessage('Updating your profile...');
      if (isCreator) {
        await contractCalls.updateCreatorProfile(
          userAddress,
          editedDisplayName,
          editedBio
        );
      } else {
        await contractCalls.updatePublicUserProfile(
          userAddress,
          editedDisplayName,
          editedBio
        );
      }
      setMessage('Profile updated! Waiting for confirmation...');
      let attempts = 0;
      const maxAttempts = 15;
      const checkUpdate = setInterval(async () => {
        attempts++;
        try {
          const updatedProfile = isCreator 
            ? await contractCalls.getCreatorProfile(userAddress)
            : await contractCalls.getPublicUserProfile(userAddress);
          const profileData = updatedProfile?.value || updatedProfile;
          if (profileData) {
            const newBio = profileData.bio?.value || profileData.bio || '';
            if (newBio === editedBio) {
              clearInterval(checkUpdate);
              setMessage('Profile updated successfully!');
              setLoading(false);
              setIsEditing(false);
              if (onProfileUpdate) onProfileUpdate(updatedProfile);
              setTimeout(() => setMessage(''), 3000);
            }
          }
          if (attempts >= maxAttempts) {
            clearInterval(checkUpdate);
            setMessage('Profile updated! Please refresh to see changes.');
            setLoading(false);
          }
        } catch (error) {
          console.log('Checking for update...', error);
        }
      }, 5000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile: ' + error.message);
      setLoading(false);
    }
  };
  
  const handleCancelEdit = () => {
    const profileData = userProfile?.value || userProfile;
    if (profileData) {
      setEditedBio(profileData.bio?.value || profileData.bio || '');
      setEditedDisplayName(profileData['display-name']?.value || profileData.displayName || '');
    }
    setIsEditing(false);
    setMessage('');
  };
  
  if (!userProfile) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-empty">
            <h2>No Profile Found</h2>
            <p>You haven't created a profile yet.</p>
            <p>Please create a profile to get started!</p>
          </div>
        </div>
      </div>
    );
  }
  
  const profileData = userProfile.value || userProfile;
  const username = profileData.username?.value || profileData.username || profileData.displayName || 'Unknown';
  const displayName = profileData['display-name']?.value || profileData.displayName || 'Unknown';
  const bio = profileData.bio?.value || profileData.bio || 'No bio available';
  const profileType = isCreator ? 'Creator' : 'Public User';
  
  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="profile-header-info">
            <h1 className="profile-title">{displayName}</h1>
            <p className="profile-username">@{username}</p>
            <span className="profile-badge">{profileType}</span>
          </div>
        </div>
        
        {message && (
          <div className={`profile-message ${message.includes('Error') || message.includes('Wallet') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
        
        <div className="profile-details">
          {!isEditing ? (
            <>
              <div className="profile-section">
                <h3 className="section-title">Bio</h3>
                <p className="profile-bio">{bio}</p>
              </div>
              
              {isCreator && (
                <div className="profile-section">
                  <h3 className="section-title">Published Content</h3>
                  
                  {loadingContent ? (
                    <p style={{color: 'rgba(255,255,255,0.7)'}}>Loading content...</p>
                  ) : creatorContent && creatorContent.length === 0 ? (
                    <p style={{color: 'rgba(255,255,255,0.7)'}}>No content published yet. Start creating!</p>
                  ) : (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                      gap: '20px',
                      marginTop: '20px'
                    }}>
                      {creatorContent && creatorContent.map((content) => (
                        <div key={content.id} style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '12px',
                          padding: '20px',
                          border: '1px solid rgba(255, 215, 0, 0.2)'
                        }}>
                          {content.ipfsHash && (
                            <img 
                              src={`https://ipfs.io/ipfs/${content.ipfsHash}`}
                              alt={content.title}
                              style={{
                                width: '100%',
                                height: '200px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                marginBottom: '15px'
                              }}
                            />
                          )}
                          <h4 style={{color: '#FFD700', margin: '10px 0', fontSize: '18px'}}>
                            {content.title}
                          </h4>
                          <p style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            marginBottom: '15px'
                          }}>
                            {content.description}
                          </p>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            color: 'rgba(255, 255, 255, 0.6)'
                          }}>
                            <span>ID: {content.id}</span>
                            <span>Category: {content.category}</span>
                          </div>
                          {content.ipfsHash && (
                            
                              <a href={`https://gateway.pinata.cloud/ipfs/${content.ipfsHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-block',
                                marginTop: '10px',
                                color: '#FFD700',
                                fontSize: '13px',
                                textDecoration: 'none',
                                border: '1px solid #FFD700',
                                padding: '4px 12px',
                                borderRadius: '6px',
                              }}
                            >
                              {'View Content →'}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <button 
                className="btn-primary profile-edit-btn"
                onClick={() => setIsEditing(true)}
                disabled={loading}
              >
                Edit Profile
              </button>
            </>
          ) : (
            <form onSubmit={handleUpdateProfile} className="profile-edit-form">
              <div className="form-group">
                <label htmlFor="editDisplayName">Display Name</label>
                <input
                  id="editDisplayName"
                  type="text"
                  value={editedDisplayName}
                  onChange={(e) => setEditedDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  maxLength={32}
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="editBio">Bio</label>
                <textarea
                  id="editBio"
                  value={editedBio}
                  onChange={(e) => setEditedBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  maxLength={256}
                  rows={5}
                  required
                  disabled={loading}
                />
                <span className="char-count">{editedBio.length}/256</span>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;


// IPFS Uploader Component for Glamora
// This component allows users to upload images directly to IPFS via Pinata
// Once uploaded, users can preview the image and get the IPFS hash

import React, { useState } from 'react';
import './IpfsUploader.css';

function IpfsUploader({ onUploadComplete }) {
  // State to track upload status and file information
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [ipfsHash, setIpfsHash] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Pinata API credentials
  const PINATA_API_KEY = '2f9a5bcc29525dd5ef76';
  const PINATA_SECRET_KEY = '5b6d43149a514842150aa89c11c58b00ed72368dadd89252532b36af3f87e62f';

  // Handle when user selects a file
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Validate file is an image
      if (!selectedFile.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        return;
      }

      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setUploadError(null);
      setIpfsHash(null); // Reset previous upload
      
      // Create preview of the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Upload file to IPFS via Pinata
  const uploadToIPFS = async () => {
    if (!file) {
      setUploadError('Please select a file first');
      return;
    }

    // Check if API keys are configured
    if (PINATA_API_KEY === 'YOUR_PINATA_API_KEY_HERE' || 
        PINATA_SECRET_KEY === 'YOUR_PINATA_SECRET_KEY_HERE') {
      setUploadError('Please configure your Pinata API keys in IpfsUploader.jsx');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);

      // Optional: Add metadata
      const metadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          app: 'Glamora',
          type: 'fashion-content'
        }
      });
      formData.append('pinataMetadata', metadata);

      // Upload to Pinata
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed. Please check your Pinata API keys.');
      }

      const data = await response.json();
      
      if (data.IpfsHash) {
        console.log('Successfully uploaded to IPFS:', data.IpfsHash);
        setIpfsHash(data.IpfsHash);
        
        // Send hash back to parent component (App.jsx)
        onUploadComplete(data.IpfsHash);
        
        setUploadError(null);
      } else {
        throw new Error('No IPFS hash returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload image to IPFS. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Generate IPFS gateway URL for viewing
  const getIpfsUrl = (hash) => {
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  };

  // Reset the uploader
  const resetUploader = () => {
    setFile(null);
    setPreview(null);
    setIpfsHash(null);
    setUploadError(null);
  };

  return (
    <div className="ipfs-uploader">
      <h4>Upload Fashion Image to IPFS</h4>
      
      {/* File selection */}
      {!ipfsHash && (
        <div className="upload-section">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            id="file-input"
            className="file-input"
          />
          <label htmlFor="file-input" className="file-label">
            {file ? file.name : 'Choose Image File'}
          </label>
          <p className="file-hint">Supported: JPG, PNG, GIF (Max 10MB)</p>
        </div>
      )}

      {/* Image preview before upload */}
      {preview && !ipfsHash && (
        <div className="preview-section">
          <p className="preview-label">Image Preview:</p>
          <img src={preview} alt="Preview" className="preview-image" />
          
          <div className="upload-actions">
            <button 
              onClick={uploadToIPFS} 
              disabled={uploading}
              className="upload-btn"
            >
              {uploading ? 'Uploading to IPFS...' : 'Upload to IPFS'}
            </button>
            <button 
              onClick={resetUploader}
              className="cancel-btn"
              disabled={uploading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success state - show uploaded image with link */}
      {ipfsHash && (
        <div className="success-section">
          <p className="success-message">Image uploaded successfully to IPFS!</p>
          
          <div className="ipfs-result">
            <img 
              src={getIpfsUrl(ipfsHash)} 
              alt="Uploaded to IPFS" 
              className="uploaded-image"
            />
            
            <div className="ipfs-info">
              <p className="ipfs-hash-label">IPFS Hash:</p>
              <code className="ipfs-hash">{ipfsHash}</code>
              
              <a 
                href={getIpfsUrl(ipfsHash)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="view-ipfs-link"
              >
                View on IPFS Gateway →
              </a>
              
              <button 
                onClick={resetUploader}
                className="upload-another-btn"
              >
                Upload Another Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {uploadError && (
        <div className="error-message">
          <p>Error: {uploadError}</p>
        </div>
      )}
    </div>
  );
}

export default IpfsUploader;


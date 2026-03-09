// IPFS Uploader Component for Glamora
// This component allows users to upload images and videos directly to IPFS via Pinata
// Once uploaded, users can preview the content and get the IPFS hash

import React, { useState } from 'react';
import './IpfsUploader.css';

function IpfsUploader({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [ipfsHash, setIpfsHash] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const PINATA_API_KEY = '2f9a5bcc29525dd5ef76';
  const PINATA_SECRET_KEY = '5b6d43149a514842150aa89c11c58b00ed72368dadd89252532b36af3f87e62f';

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Validate file is an image or video
      if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
        setUploadError('Please select an image or video file');
        return;
      }

      // 10MB limit for images, 100MB for videos
      const maxSize = selectedFile.type.startsWith('video/') 
        ? 100 * 1024 * 1024 
        : 10 * 1024 * 1024;
        
      if (selectedFile.size > maxSize) {
        setUploadError(selectedFile.type.startsWith('video/') 
          ? 'Video size must be less than 100MB' 
          : 'Image size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setUploadError(null);
      setIpfsHash(null);
      
      // Preview for images only
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(selectedFile);
      } else {
        // For video just show filename as confirmation
        setPreview(null);
      }
    }
  };

  const uploadToIPFS = async () => {
    if (!file) {
      setUploadError('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const metadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          app: 'Glamora',
          type: file.type.startsWith('video/') ? 'fashion-video' : 'fashion-content'
        }
      });
      formData.append('pinataMetadata', metadata);

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
        onUploadComplete(data.IpfsHash);
        setUploadError(null);
      } else {
        throw new Error('No IPFS hash returned');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload to IPFS. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getIpfsUrl = (hash) => {
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  };

  const resetUploader = () => {
    setFile(null);
    setPreview(null);
    setIpfsHash(null);
    setUploadError(null);
  };

  return (
    <div className="ipfs-uploader">
      <h4>Upload Fashion Content to IPFS</h4>
      
      {!ipfsHash && (
        <div className="upload-section">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            disabled={uploading}
            id="file-input"
            className="file-input"
          />
          <label htmlFor="file-input" className="file-label">
            {file ? file.name : 'Choose Image or Video File'}
          </label>
          <p className="file-hint">Images: JPG, PNG, GIF (Max 10MB) · Videos: MP4, MOV (Max 100MB)</p>
        </div>
      )}

      {/* Image preview before upload */}
      {preview && !ipfsHash && (
        <div className="preview-section">
          <p className="preview-label">Preview:</p>
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

      {/* Video selected but no preview - show upload button directly */}
      {file && !preview && !ipfsHash && (
        <div className="preview-section">
          <p className="preview-label">Video selected: {file.name}</p>
          
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

      {/* Success state */}
      {ipfsHash && (
        <div className="success-section">
          <p className="success-message">Content uploaded successfully to IPFS!</p>
          
          <div className="ipfs-result">
            {/* Show image preview if it was an image */}
            {preview && (
              <img 
                src={getIpfsUrl(ipfsHash)} 
                alt="Uploaded to IPFS" 
                className="uploaded-image"
              />
            )}
            
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
                Upload Another File
              </button>
            </div>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="error-message">
          <p>Error: {uploadError}</p>
        </div>
      )}
    </div>
  );
}

export default IpfsUploader;

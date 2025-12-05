// Stacks Utilities - Helper Functions
// This file makes it easier to interact with our Clarity smart contracts.

import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  stringUtf8CV,
  uintCV,
  principalCV,
  standardPrincipalCV,
  contractPrincipalCV,
  bufferCV,
  tupleCV,
  listCV,
  fetchCallReadOnlyFunction,
} from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import { NETWORK_CONFIG, CONTRACT_CONFIG } from './contractConfig';

// Get the network configuration
export const getNetwork = () => {
  return STACKS_TESTNET;
};

// Call a contract function (writable function)
export const callContract = async (userSession, functionName, functionArgs, onFinish) => {
  const options = {
    network: getNetwork(),
    contractAddress: CONTRACT_CONFIG.address,
    contractName: CONTRACT_CONFIG.name,
    functionName,
    functionArgs,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    onFinish,
  };
  
  await makeContractCall(options);
};

// Export cv (Clarity Values) helpers
export const cv = {
  string: stringUtf8CV,
  uint: uintCV,
  principal: principalCV,
  standardPrincipal: standardPrincipalCV,
  contractPrincipal: contractPrincipalCV,
  buffer: bufferCV,
  tuple: tupleCV,
  list: listCV,
};

// Get contract principal string
export const getContractPrincipal = () => {
  return `${CONTRACT_CONFIG.address}.${CONTRACT_CONFIG.name}`;
};

// Generate a mock IPFS hash for testing
export const generateMockIPFSHash = () => {
  return 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Handle contract errors
export const handleContractError = (error) => {
  console.error('Contract call error:', error);
  alert('Transaction failed. Please try again.');
};

// Export fetchCallReadOnlyFunction directly from the library
export { fetchCallReadOnlyFunction };


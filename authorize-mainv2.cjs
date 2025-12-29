const transactions = require('@stacks/transactions');

// Private key derived from the standard Clarinet test mnemonic
const privateKey = 'edf9aee84d9b7abc145504dde6726c64f369d37ee34ded868fabd876c26570bc01';

async function authorizeMainv2() {
  console.log('Creating authorization transaction...');
  
  // Configure the contract call to authorize mainv2 in storage
  const txOptions = {
    contractAddress: 'STC5KHM41H6WHAST7MWWDD807YSPRQKJ68T330BQ',
    contractName: 'storage',
    functionName: 'set-authorized-contract',
    functionArgs: [
      // Pass mainv2 contract principal as the authorized contract
      transactions.principalCV('STC5KHM41H6WHAST7MWWDD807YSPRQKJ68T330BQ.mainv2')
    ],
    senderKey: privateKey,
    network: 'testnet',
    anchorMode: transactions.AnchorMode.Any,
    fee: 100000 // Fee in microSTX (0.1 STX)
  };

  try {
    // Create the contract call transaction
    const transaction = await transactions.makeContractCall(txOptions);
    console.log('Broadcasting transaction to testnet...');
    
    // Broadcast directly to testnet API endpoint
    const response = await fetch('https://api.testnet.hiro.so/v2/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: transaction.serialize()
    });
    
    const result = await response.json();
    
    // Check if broadcast was successful
    if (response.ok) {
      console.log('Transaction broadcast successfully!');
      console.log('Transaction ID:', result.txid);
      console.log('Check status: https://explorer.hiro.so/txid/' + result.txid + '?chain=testnet');
    } else {
      console.error('Broadcast failed:', result);
    }
  } catch (error) {
    console.error('Error occurred:', error.message);
  }
}

// Execute the authorization
authorizeMainv2();

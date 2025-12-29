const transactions = require('@stacks/transactions');

// The private key we're using
const privateKey = 'edf9aee84d9b7abc145504dde6726c64f369d37ee34ded868fabd876c26570bc01';

// Get the address from this private key
const address = transactions.getAddressFromPrivateKey(privateKey);

console.log('Private key:', privateKey);
console.log('Derived address:', address);
console.log('Expected address: STC5KHM41H6WHAST7MWWDD807YSPRQKJ68T330BQ');
console.log('Match:', address === 'STC5KHM41H6WHAST7MWWDD807YSPRQKJ68T330BQ');
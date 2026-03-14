import pkg from '@stacks/transactions';
import { readFileSync } from 'fs';

const { makeUnsignedContractDeploy, AnchorMode, TransactionSigner, privateKeyToPublic, publicKeyToHex, signWithKey } = pkg;

const PRIVATE_KEY = 'd956acaea8177a98858f58971f04ff16dc26ac841823b8518e410f9e6222d52e01';
const code = readFileSync('../contracts/main.clar', 'utf8');

const pubKeyHex = publicKeyToHex(privateKeyToPublic(PRIVATE_KEY));

const tx = await makeUnsignedContractDeploy({
  contractName: 'main-v12',
  codeBody: code,
  publicKey: pubKeyHex,
  network: 'testnet',
  anchorMode: AnchorMode.Any,
  fee: 500000n,
  nonce: 129n,
});

const signer = new TransactionSigner(tx);
signer.signOrigin({ data: Buffer.from(PRIVATE_KEY, 'hex'), compressed: true });

const hex = Buffer.from(tx.serialize()).toString('hex');

const result = await fetch('https://api.hiro.so/rosetta/v1/construction/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    network_identifier: { blockchain: 'stacks', network: 'testnet' },
    signed_transaction: '0x' + hex,
  }),
});

const data = await result.json();
console.log('main-v12:', JSON.stringify(data));
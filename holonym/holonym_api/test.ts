import { issue, get_pubkey } from 'holonym-wasm-issuer';

async function main() {
  const privateKey = '909ccb104d3fc066c9431d354ac3aaf0bc8f2976913ee2debf3c6def8a9dca02';

  const issuanceNullifier = '1234567890'; // Puedes reemplazar este valor según corresponda
  const field1 = '15554206969';
  const field2 = '2603784193916030667265976259156130949263115346292859097693709746006196410223';

  try {
    const response = issue(privateKey, issuanceNullifier, field1, field2);
    const publicKey = get_pubkey(privateKey);

    console.log('Response:', response);
    console.log('Public Key:', publicKey);
  } catch (error: any) {
    console.error('Error:', error);
  }
}

main();

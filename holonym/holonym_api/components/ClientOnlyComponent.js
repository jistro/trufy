// components/ClientOnlyComponent.js
import React, { useEffect } from 'react';
import { issue, getPubkey, getAddress } from 'holonym-wasm-issuer';

export default function ClientOnlyComponent() {
  useEffect(() => {
    const privateKey = '909ccb104d3fc066c9431d354ac3aaf0bc8f2976913ee2debf3c6def8a9dca02';
    const field1 = '15554206969';
    const field2 = '2603784193916030667265976259156130949263115346292859097693709746006196410223';

    try {
      const response = issue(privateKey, field1, field2);
      const publicKey = getPubkey(privateKey);
      const address = getAddress(privateKey);

      console.log('Response:', response);
      console.log('Public Key:', publicKey);
      console.log('Address:', address);
    } catch (error) {
      console.error('Error:', error);
    }
  }, []);

  return <div>Contenido cargado en el cliente</div>;
}

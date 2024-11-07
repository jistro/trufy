// components/ClientOnlyComponent.tsx
import React, { useEffect } from 'react';

const ClientOnlyComponent: React.FC = () => {
  useEffect(() => {
    (async () => {
      const { issue, getPubkey, getAddress } = await import('holonym-wasm-issuer');

      // Tu código aquí
    })();
  }, []);

  return <div>Componente cargado en el cliente</div>;
};

export default ClientOnlyComponent;

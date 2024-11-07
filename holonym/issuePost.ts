// issue.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { issue, get_pubkey } from 'holonym-wasm-issuer';
import crypto from 'crypto';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const privateKey: string | undefined = process.env.HOLONYM_ISSUER_PRIVKEY;

  console.log('Private Key:', privateKey);

  // Verificar que la clave privada está definida y tiene la longitud correcta
  if (!privateKey || privateKey.length !== 64) {
    console.error('La clave privada no está definida o no tiene la longitud correcta.');
    return res.status(500).json({ error: 'La clave privada no está definida o es inválida.' });
  }

  let field1: string | undefined;
  let field2: string | undefined;

  if (req.method === 'POST') {
    field1 = req.body.field1;
    field2 = req.body.field2;
  } else if (req.method === 'GET') {
    field1 = req.query.field1 as string | undefined;
    field2 = req.query.field2 as string | undefined;
  } else {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Verificar que field1 y field2 están definidos
  if (!field1 || !field2) {
    return res.status(400).json({ error: 'field1 y field2 son requeridos.' });
  }

  console.log('Field1:', field1);
  console.log('Field2:', field2);

  try {
    const issuanceNullifier = crypto.randomBytes(16).toString('hex');
    const response = issue(privateKey, issuanceNullifier, field1, field2);
    const publicKey = get_pubkey(privateKey);

    res.status(200).json({
      response,
      publicKey,
    });
  } catch (error: any) {
    console.error('Error al ejecutar issue:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ManagementClient } from 'auth0';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, MGMT_AUTH0_CLIENT_SECRET } from '$env/static/private';

const AUTH0_AUDIENCE = 'http://my-api';

const JWKS = createRemoteJWKSet(
  new URL(`https://${VITE_AUTH0_DOMAIN}/.well-known/jwks.json`)
);

export const POST: RequestHandler = async ({ request }) => {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json(
        { error: 'Missing bearer token' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://${VITE_AUTH0_DOMAIN}/`,
      audience: AUTH0_AUDIENCE,
    });

    const typedScopes = payload.scope as string
    const scopes = typedScopes.split(' ') || [];

    if (!scopes.includes('update:orders')) {
        return json(
            { error: 'Insufficient scope' },
            { status: 403 }
        );
    }

    const management = new ManagementClient({
        domain: VITE_AUTH0_DOMAIN,
        clientId: VITE_AUTH0_CLIENT_ID,
        clientSecret: MGMT_AUTH0_CLIENT_SECRET,
    });

    await management.users.update(payload.sub as string, {
        user_metadata: { 
            orders: body?.data,
         }
    });

    return json({
      message: 'Order has been submitted successfully!',
      user: payload.sub,
      payload
    }, { status: 200});

  } catch (err) {
    console.error(err);
    return json({ error: 'Invalid or expired token' }, { status: 401 });
  }
};
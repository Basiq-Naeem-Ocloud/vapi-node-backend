import { logger } from './logger.js';

export function validateVapiSecret(request, reply) {
  const vapiSecret = request.headers['x-vapi-secret'];
  if (!vapiSecret || vapiSecret !== process.env.VAPI_SECRET) {
    logger.error('Invalid or missing VAPI secret');
    reply.code(401).send({ error: 'Invalid or missing VAPI secret' });
    return false;
  }
  return true;
}

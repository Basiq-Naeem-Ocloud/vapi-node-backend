import dotenv from 'dotenv';
import Fastify from 'fastify';
import messagesRoutes from './routes/messages.js';
import ngrokPlugin from './plugins/ngrok.js';
import sensiblePlugin from './plugins/sensible.js';
import { loggerConfig } from './utils/logger.js';
import { connectToMongoDB } from './utils/db.js';

dotenv.config();
const app = Fastify({
  logger: loggerConfig
});

app.addHook('onSend', (_request, reply, payload, done) => {
  reply.raw.payload = payload;
  done();
});

// plugins
app.register(sensiblePlugin);

// Only register ngrok plugin if enabled (for local development only)
if (process.env.ENABLE_NGROK === 'true') {
  app.register(ngrokPlugin);
}

// routes
app.register(messagesRoutes);

const start = async () => {
  try {
    // Connect to MongoDB before starting the server
    await connectToMongoDB();
    
    const port = process.env.PORT || 4000;
    await app.listen({
      port,
    });
    app.log.info(`Server listening on port ${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

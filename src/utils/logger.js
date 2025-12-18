import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

export const loggerConfig = isProd
  ? {
      level: 'info',
      serializers: {
        res(reply) {
          return {
            statusCode: reply.statusCode,
            body: reply.raw?.payload,
          };
        },
      },
    }
  : {
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:mm:ss',
          ignore: 'pid,hostname',
          messageFormat: '{msg}',
        },
      },
      serializers: {
        res(reply) {
          return {
            statusCode: reply.statusCode,
            body: reply.raw?.payload,
          };
        },
      },
    };

// Create a logger instance for use in utility functions
export const logger = pino(loggerConfig);

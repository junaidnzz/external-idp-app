import { App } from './app';
import { validateConfig } from './config/env.config';
import { logger } from './utils/logger';

const startServer = async (): Promise<void> => {
  try {
    validateConfig();
    
    const app = new App();
    app.listen();
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
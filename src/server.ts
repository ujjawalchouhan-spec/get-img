import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';

const PORT = config.PORT;

const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running in ${config.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
    logger.fatal(err, 'UNHANDLED REJECTION! 💥 Shutting down...');
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
    logger.fatal(err, 'UNCAUGHT EXCEPTION! 💥 Shutting down...');
    process.exit(1);
});

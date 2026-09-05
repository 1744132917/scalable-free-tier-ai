import { cfg } from './config.js';
import { logger } from './observability/logger.js';
import { createApp } from './app.js';

const app = createApp();

app.listen(cfg.PORT, () => {
  logger.info({ port: cfg.PORT }, 'server started');
});

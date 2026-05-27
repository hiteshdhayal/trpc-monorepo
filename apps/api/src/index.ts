import http from "node:http";
import { logger } from "@repo/logger";
import { createApp } from "./server";

import { env } from "./env";

async function init() {
  try {
    const app = await createApp();
    const server = http.createServer(app);
    const PORT: number = env.PORT ? +env.PORT : 8000;
    server.listen(PORT, () => {
      logger.info(`http server is running on PORT ${PORT}`);
    });
  } catch (err) {
    logger.error(`Error creating http server`, { err });
    process.exit(1);
  }
}

init();

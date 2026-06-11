import { EventEmitter } from "events";
import type { Response } from "express";
import { logger } from "./logger";

class SseManager extends EventEmitter {
  private clients = new Set<Response>();

  addClient(res: Response) {
    this.clients.add(res);
    logger.debug({ count: this.clients.size }, "SSE client connected");
    res.on("close", () => {
      this.clients.delete(res);
      logger.debug({ count: this.clients.size }, "SSE client disconnected");
    });
  }

  broadcast(data: unknown) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const res of this.clients) {
      try {
        res.write(payload);
      } catch {
        this.clients.delete(res);
      }
    }
  }
}

export const sseManager = new SseManager();

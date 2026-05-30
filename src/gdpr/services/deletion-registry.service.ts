import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

export interface DeletionHandler {
  moduleName: string;
  deleteForUser: (userId: string, manager: EntityManager) => Promise<void>;
}

@Injectable()
export class DeletionRegistryService {
  private readonly logger = new Logger(DeletionRegistryService.name);
  private readonly handlers: DeletionHandler[] = [];

  constructor(private readonly dataSource: DataSource) {}

  register(handler: DeletionHandler): void {
    this.handlers.push(handler);
    this.logger.log(`DeletionRegistry: registered handler for module "${handler.moduleName}"`);
  }

  getRegisteredModules(): string[] {
    return this.handlers.map((h) => h.moduleName);
  }

  async deleteAllForUser(userId: string): Promise<void> {
    this.logger.log(
      `DeletionRegistry: running ${this.handlers.length} handlers for user ${userId}`,
    );

    await this.dataSource.transaction(async (manager) => {
      for (const handler of this.handlers) {
        try {
          await handler.deleteForUser(userId, manager);
          this.logger.log(`DeletionRegistry: "${handler.moduleName}" completed for user ${userId}`);
        } catch (error) {
          this.logger.error(
            `DeletionRegistry: handler "${handler.moduleName}" failed for user ${userId}: ${error.message}`,
          );
          throw error;
        }
      }
    });

    this.logger.log(`DeletionRegistry: all handlers completed for user ${userId}`);
  }
}

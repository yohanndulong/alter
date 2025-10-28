import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  /**
   * Health check endpoint
   * Returns API status and database connection status
   * Used by monitoring tools, load balancers, etc.
   */
  @Get('health')
  async healthCheck() {
    try {
      // Test database connection
      await this.connection.query('SELECT 1');

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
        environment: process.env.NODE_ENV || 'development',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'disconnected',
        environment: process.env.NODE_ENV || 'development',
        error: error.message,
      };
    }
  }

  /**
   * Simple ping endpoint
   * Quick check without database query
   */
  @Get('ping')
  ping() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'pong',
    };
  }
}

import { Sequelize } from 'sequelize-typescript';
import { env } from './env';
import { logger } from '../utils/logger';
import path from 'path';

let sequelize: Sequelize;

export function getSequelize(): Sequelize {
  if (!sequelize) {
    sequelize = new Sequelize({
      dialect: 'mssql',
      host: env.db.server,
      database: env.db.name,
      username: env.db.user,
      password: env.db.password,
      port: 1433,
      logging: env.isProduction ? false : (msg) => logger.debug(msg),
      models: [path.join(__dirname, '../models')],
      define: {
        timestamps: true,
        underscored: false,
      },
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      dialectOptions: {
        options: {
          encrypt: true,
          trustServerCertificate: false,
          enableArithAbort: true,
          requestTimeout: 30000,
        },
      },
    });
  }
  return sequelize;
}

export async function connectDatabase(): Promise<void> {
  const db = getSequelize();
  try {
    await db.authenticate();
    logger.info('Azure SQL Database connection established.');

    if (!env.isProduction) {
      await db.sync({ alter: true });
      logger.info('Database models synchronized (alter mode).');
    }
  } catch (err) {
    logger.error('Unable to connect to Azure SQL Database:', err);
    throw err;
  }
}

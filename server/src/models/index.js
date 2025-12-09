'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;

// If environment variables for DB are provided (e.g. on Render), prefer them and
// allow passing TLS CA via `DB_SSL_CA` for secure connections to TiDB Cloud.
const hasEnvDb = !!process.env.DB_HOST || !!process.env.DATABASE_URL || !!config.use_env_variable;
if (hasEnvDb) {
  // Build options from environment variables when available
  const dbName = process.env.DB_NAME || process.env.DATABASE || config.database;
  const dbUser = process.env.DB_USER || process.env.DATABASE_USER || config.username;
  const dbPass = process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || config.password;
  const dbHost = process.env.DB_HOST || config.host;
  const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : (config.port || undefined);

  const sequelizeOptions = Object.assign({}, config, {
    host: dbHost,
    port: dbPort,
    dialect: config.dialect || 'mysql'
  });

  // Dialect options for TLS/SSL. TiDB Cloud requires secure connections.
  const sslCa = process.env.DB_SSL_CA || process.env.DB_SSL_CERT || null;
  if (!sequelizeOptions.dialectOptions) sequelizeOptions.dialectOptions = {};
  if (sslCa) {
    // If the CA is provided as an env var (PEM content), pass it to the driver
    sequelizeOptions.dialectOptions.ssl = {
      ca: sslCa,
      rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED !== 'false'
    };
  } else if (process.env.DB_REQUIRE_SSL === 'true') {
    // If user explicitly requires SSL but didn't provide CA, still enable TLS
    sequelizeOptions.dialectOptions.ssl = { rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED !== 'false' };
  }

  sequelize = new Sequelize(dbName, dbUser, dbPass, sequelizeOptions);
} else if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
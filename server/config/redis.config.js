// // config/redis.config.js

// const Redis = require('ioredis');
// const { promisify } = require('util');

// const client = new Redis({
//   host: process.env.REDIS_HOST || 'localhost',
//   port: process.env.REDIS_PORT || 6379,
//   password: process.env.REDIS_PASSWORD || undefined,
// });

// client.on('connect', () => {
//   console.log('✅ Connected to Redis');
// });

// client.on('error', (err) => {
//   console.error('❌ Redis error:', err);
// });

// // Promisify Redis methods for async/await usage
// const getAsync = promisify(client.get).bind(client);
// const setexAsync = promisify(client.setex).bind(client);
// const setAsync = promisify(client.set).bind(client);
// const delAsync = promisify(client.del).bind(client);

// module.exports = {
  // client,
//   get: getAsync,
//   setex: setexAsync,
//   set: setAsync,
//   del: delAsync
// };





// const Redis = require('ioredis');

// const client = new Redis({
//   host: process.env.REDIS_HOST,      // Redis host from environment
//   port: process.env.REDIS_PORT,      // Redis port from environment
//   password: process.env.REDIS_PASSWORD || undefined
// });

// client.on('connect', () => {
//   console.log('Connected to Redis');
// });

// client.on('error', (err) => {
//   console.error('Redis error:', err);
// });

// // Helper functions
// async function setValue(key, value, expireInSec = null) {
//   if (expireInSec) {
//     await client.set(key, value, 'EX', expireInSec);
//   } else {
//     await client.set(key, value);
//   }
// }

// async function getValue(key) {
//   return await client.get(key);
// }

// async function deleteValue(key) {
//   return await client.del(key);
// }

// module.exports = {
//   client,
//   setValue,
//   getValue,
//   deleteValue
// };


// const Redis = require('ioredis');

// const client = new Redis({
//   host: process.env.REDIS_HOST   , // Redis host from environment
//   port: process.env.REDIS_PORT,      // Redis port from environment
//   password: process.env.REDIS_PASSWORD || undefined
// });

// client.on('connect', () => {
//   console.log('Connected to Redis');
// });

// client.on('error', (err) => {
//   console.error('Redis error:', err);
// });

// // Helper functions
// async function setValue(key, value, expireInSec = null) {
//   if (expireInSec) {
//     await client.set(key, value, 'EX', expireInSec);
//   } else {
//     await client.set(key, value);
//   }
// }

// async function getValue(key) {
//   return await client.get(key);
// }

// async function deleteValue(key) {
//   return await client.del(key);
// }

// module.exports = {
//   client,
//   get: getAsync,
//   setex: setexAsync,
//   set: setAsync,
//   del: delAsync,
//   setValue,
//   getValue,
//   deleteValue,
// };

// Redis and BullMQ Configuration
const Redis = require("ioredis")
const { Queue, Worker } = require("bullmq")

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
}

// Create Redis connection
const redis = new Redis(redisConfig)

// Queue configurations
const queueConfig = {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
}

// Create queues for different notification types
const emailQueue = new Queue("email-notifications", queueConfig)
const smsQueue = new Queue("sms-notifications", queueConfig)
const pushQueue = new Queue("push-notifications", queueConfig)

// Queue management functions
async function addEmailJob(data) {
  return await emailQueue.add("send-email", data, {
    delay: data.delay || 0,
    priority: data.priority || 0,
  })
}

async function addSmsJob(data) {
  return await smsQueue.add("send-sms", data, {
    delay: data.delay || 0,
    priority: data.priority || 0,
  })
}

async function addPushJob(data) {
  return await pushQueue.add("send-push", data, {
    delay: data.delay || 0,
    priority: data.priority || 0,
  })
}

// Export queue instances and functions
module.exports = {
  redis,
  emailQueue,
  smsQueue,
  pushQueue,
  addEmailJob,
  addSmsJob,
  addPushJob,
}

console.log("Queue configuration initialized")
console.log("Available queues: email-notifications, sms-notifications, push-notifications")

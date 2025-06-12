// MongoDB Models for Notification System
const mongoose = require("mongoose")

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/notifications", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log("Connected to MongoDB")
  } catch (error) {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  }
}

// Notification Schema
const notificationSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["email", "sms", "push"],
  },
  to: {
    type: String,
    required: true,
  },
  template: {
    type: String,
    required: true,
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  status: {
    type: String,
    required: true,
    enum: ["queued", "processing", "sent", "failed"],
    default: "queued",
  },
  result: {
    type: String, // Message ID, SID, etc.
  },
  error: {
    type: String,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Template Schema
const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["email", "sms", "push"],
  },
  subject: {
    type: String, // For email templates
  },
  content: {
    type: String,
    required: true,
  },
  variables: [
    {
      name: String,
      description: String,
      required: {
        type: Boolean,
        default: false,
      },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Log Schema for audit trail
const logSchema = new mongoose.Schema({
  notificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Notification",
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: ["created", "queued", "processing", "sent", "failed", "retried"],
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

// Create models
const Notification = mongoose.model("Notification", notificationSchema)
const Template = mongoose.model("Template", templateSchema)
const Log = mongoose.model("Log", logSchema)

// Helper functions
async function createNotification(data) {
  const notification = new Notification(data)
  await notification.save()

  // Create log entry
  await createLog(notification._id, "created", data)

  return notification
}

async function updateNotificationStatus(jobId, status, result = null, error = null) {
  const notification = await Notification.findOneAndUpdate(
    { jobId },
    {
      status,
      result,
      error,
      updatedAt: new Date(),
      $inc: { attempts: 1 },
    },
    { new: true },
  )

  if (notification) {
    await createLog(notification._id, status, { result, error })
  }

  return notification
}

async function createLog(notificationId, action, details) {
  const log = new Log({
    notificationId,
    action,
    details,
  })
  await log.save()
  return log
}

async function getNotificationStats() {
  const stats = await Notification.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ])

  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count
    return acc
  }, {})
}

// Seed default templates
async function seedTemplates() {
  const defaultTemplates = [
    {
      name: "welcome",
      type: "email",
      subject: "Welcome to {{appName}}!",
      content: "<h1>Welcome {{username}}!</h1><p>Thank you for joining {{appName}}.</p>",
      variables: [
        { name: "username", description: "User's name", required: true },
        { name: "appName", description: "Application name", required: true },
      ],
    },
    {
      name: "verification",
      type: "email",
      subject: "Verify your email address",
      content: "<h1>Email Verification</h1><p>Your verification code is: <strong>{{code}}</strong></p>",
      variables: [{ name: "code", description: "Verification code", required: true }],
    },
    {
      name: "welcome",
      type: "sms",
      content: "Welcome {{username}}! Thanks for joining {{appName}}.",
      variables: [
        { name: "username", description: "User's name", required: true },
        { name: "appName", description: "Application name", required: true },
      ],
    },
    {
      name: "verification",
      type: "sms",
      content: "Your verification code is: {{code}}",
      variables: [{ name: "code", description: "Verification code", required: true }],
    },
  ]

  for (const template of defaultTemplates) {
    await Template.findOneAndUpdate({ name: template.name, type: template.type }, template, { upsert: true, new: true })
  }

  console.log("Default templates seeded")
}

// Initialize database
async function initializeDB() {
  await connectDB()
  await seedTemplates()
  console.log("Database initialized")
}

// Export models and functions
module.exports = {
  connectDB,
  initializeDB,
  Notification,
  Template,
  Log,
  createNotification,
  updateNotificationStatus,
  createLog,
  getNotificationStats,
  seedTemplates,
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDB().catch(console.error)
}

// Email Worker - Processes email notification jobs
const { Worker } = require("bullmq")
const nodemailer = require("nodemailer")
const Redis = require("ioredis")

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
})

// Email transporter configuration
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Email templates
const templates = {
  welcome: {
    subject: "Welcome to our platform!",
    html: "<h1>Welcome {{username}}!</h1><p>Thank you for joining us.</p>",
  },
  verification: {
    subject: "Verify your email",
    html: "<h1>Email Verification</h1><p>Your code: {{code}}</p>",
  },
  reminder: {
    subject: "Reminder",
    html: "<h1>Don't forget!</h1><p>{{message}}</p>",
  },
}

// Template rendering function
function renderTemplate(template, payload) {
  const rendered = { ...template }

  Object.keys(payload).forEach((key) => {
    const placeholder = `{{${key}}}`
    rendered.subject = rendered.subject.replace(new RegExp(placeholder, "g"), payload[key])
    rendered.html = rendered.html.replace(new RegExp(placeholder, "g"), payload[key])
  })

  return rendered
}

// Email worker
const emailWorker = new Worker(
  "email-notifications",
  async (job) => {
    const { to, template: templateName, payload } = job.data

    console.log(`Processing email job ${job.id} for ${to}`)

    try {
      // Get template
      const template = templates[templateName]
      if (!template) {
        throw new Error(`Template ${templateName} not found`)
      }

      // Render template with payload
      const rendered = renderTemplate(template, payload)

      // Send email
      const mailOptions = {
        from: process.env.FROM_EMAIL || "noreply@example.com",
        to: to,
        subject: rendered.subject,
        html: rendered.html,
      }

      const result = await transporter.sendMail(mailOptions)

      console.log(`Email sent successfully to ${to}:`, result.messageId)

      // Log to database (mock)
      await logNotification({
        jobId: job.id,
        type: "email",
        to: to,
        template: templateName,
        status: "sent",
        result: result.messageId,
      })

      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error.message)

      // Log failure
      await logNotification({
        jobId: job.id,
        type: "email",
        to: to,
        template: templateName,
        status: "failed",
        error: error.message,
      })

      throw error
    }
  },
  {
    connection: redis,
    concurrency: 5,
  },
)

// Mock logging function (replace with actual MongoDB operations)
async function logNotification(data) {
  console.log("Logging notification:", data)
  // In real implementation:
  // const notification = new Notification(data);
  // await notification.save();
}

// Worker event handlers
emailWorker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed successfully`)
})

emailWorker.on("failed", (job, err) => {
  console.error(`Email job ${job.id} failed:`, err.message)
})

emailWorker.on("error", (err) => {
  console.error("Email worker error:", err)
})

console.log("Email worker started and listening for jobs...")

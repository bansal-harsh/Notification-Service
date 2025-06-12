// SMS Worker - Processes SMS notification jobs
const { Worker } = require("bullmq")
const Redis = require("ioredis")

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
})

// Mock Twilio client (replace with actual Twilio SDK)
class MockTwilioClient {
  constructor(accountSid, authToken) {
    this.accountSid = accountSid
    this.authToken = authToken
  }

  async sendMessage(options) {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock successful response
    return {
      sid: `SM${Math.random().toString(36).substr(2, 9)}`,
      status: "sent",
      to: options.to,
      from: options.from,
      body: options.body,
    }
  }
}

const twilioClient = new MockTwilioClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

// SMS templates
const templates = {
  welcome: "Welcome {{username}}! Thanks for joining us.",
  verification: "Your verification code is: {{code}}",
  reminder: "Reminder: {{message}}",
  alert: "Alert: {{message}}",
}

// Template rendering function
function renderTemplate(template, payload) {
  let rendered = template

  Object.keys(payload).forEach((key) => {
    const placeholder = `{{${key}}}`
    rendered = rendered.replace(new RegExp(placeholder, "g"), payload[key])
  })

  return rendered
}

// SMS worker
const smsWorker = new Worker(
  "sms-notifications",
  async (job) => {
    const { to, template: templateName, payload } = job.data

    console.log(`Processing SMS job ${job.id} for ${to}`)

    try {
      // Get template
      const template = templates[templateName]
      if (!template) {
        throw new Error(`Template ${templateName} not found`)
      }

      // Render template with payload
      const message = renderTemplate(template, payload)

      // Send SMS
      const result = await twilioClient.sendMessage({
        to: to,
        from: process.env.TWILIO_PHONE_NUMBER || "+1234567890",
        body: message,
      })

      console.log(`SMS sent successfully to ${to}:`, result.sid)

      // Log to database (mock)
      await logNotification({
        jobId: job.id,
        type: "sms",
        to: to,
        template: templateName,
        status: "sent",
        result: result.sid,
      })

      return { success: true, sid: result.sid }
    } catch (error) {
      console.error(`Failed to send SMS to ${to}:`, error.message)

      // Log failure
      await logNotification({
        jobId: job.id,
        type: "sms",
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
    concurrency: 3,
  },
)

// Mock logging function
async function logNotification(data) {
  console.log("Logging SMS notification:", data)
}

// Worker event handlers
smsWorker.on("completed", (job) => {
  console.log(`SMS job ${job.id} completed successfully`)
})

smsWorker.on("failed", (job, err) => {
  console.error(`SMS job ${job.id} failed:`, err.message)
})

smsWorker.on("error", (err) => {
  console.error("SMS worker error:", err)
})

console.log("SMS worker started and listening for jobs...")

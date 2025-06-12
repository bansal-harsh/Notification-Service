"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Bell, Mail, MessageSquare, Smartphone } from "lucide-react"

export default function NotificationDashboard() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "email",
      to: "user@example.com",
      status: "sent",
      template: "welcome",
      createdAt: "2024-01-15T10:30:00Z",
    },
    {
      id: 2,
      type: "sms",
      to: "+1234567890",
      status: "queued",
      template: "verification",
      createdAt: "2024-01-15T10:25:00Z",
    },
    {
      id: 3,
      type: "push",
      to: "device_token_123",
      status: "failed",
      template: "reminder",
      createdAt: "2024-01-15T10:20:00Z",
    },
  ])

  const [formData, setFormData] = useState({
    type: "",
    to: "",
    template: "",
    payload: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          payload: JSON.parse(formData.payload || "{}"),
        }),
      })

      if (response.ok) {
        const newNotification = await response.json()
        setNotifications((prev) => [newNotification, ...prev])
        setFormData({ type: "", to: "", template: "", payload: "" })
      }
    } catch (error) {
      console.error("Failed to create notification:", error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />
      case "sms":
        return <MessageSquare className="h-4 w-4" />
      case "push":
        return <Smartphone className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800"
      case "queued":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Microservice Platform</h1>
          <p className="text-gray-600">Manage and monitor your notification delivery system</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Notification Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Create Notification</CardTitle>
              <CardDescription>Send a new notification through the queue system</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="type">Notification Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Push Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="to">Recipient</Label>
                  <Input
                    id="to"
                    value={formData.to}
                    onChange={(e) => setFormData((prev) => ({ ...prev, to: e.target.value }))}
                    placeholder="email@example.com or +1234567890"
                  />
                </div>

                <div>
                  <Label htmlFor="template">Template</Label>
                  <Select
                    value={formData.template}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, template: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="welcome">Welcome</SelectItem>
                      <SelectItem value="verification">Verification</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="payload">Payload (JSON)</Label>
                  <Textarea
                    id="payload"
                    value={formData.payload}
                    onChange={(e) => setFormData((prev) => ({ ...prev, payload: e.target.value }))}
                    placeholder='{"username": "John", "code": "123456"}'
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Queue Notification
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Monitor notification delivery status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getIcon(notification.type)}
                      <div>
                        <p className="font-medium">{notification.template}</p>
                        <p className="text-sm text-gray-500">{notification.to}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(notification.status)}>{notification.status}</Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(notification.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Architecture Overview */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>System Architecture</CardTitle>
            <CardDescription>Microservice components and data flow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Bell className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium">API Gateway</h3>
                <p className="text-sm text-gray-500">Express.js REST API</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <div className="w-6 h-6 bg-red-600 rounded"></div>
                </div>
                <h3 className="font-medium">Redis Queue</h3>
                <p className="text-sm text-gray-500">BullMQ Job Processing</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <div className="w-6 h-6 bg-green-600 rounded"></div>
                </div>
                <h3 className="font-medium">Worker Pods</h3>
                <p className="text-sm text-gray-500">Kubernetes Deployments</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <div className="w-6 h-6 bg-purple-600 rounded"></div>
                </div>
                <h3 className="font-medium">MongoDB</h3>
                <p className="text-sm text-gray-500">Data Persistence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

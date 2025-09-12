"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SettingsIcon, Bell, MapPin, Clock, Smartphone, Globe, Shield, HelpCircle, Info } from "lucide-react"

export default function Settings() {
  const [notifications, setNotifications] = useState({
    busArrivals: true,
    routeUpdates: false,
    serviceAlerts: true,
    promotions: false,
  })

  const [preferences, setPreferences] = useState({
    defaultLocation: "current",
    language: "en",
    units: "metric",
    theme: "system",
  })

  const [privacy, setPrivacy] = useState({
    locationTracking: true,
    dataSharing: false,
    analytics: true,
  })

  const [walkingDistance, setWalkingDistance] = useState([800])

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }))
  }

  const handlePreferenceChange = (key: string, value: string) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-balance mb-2">Settings</h1>
        <p className="text-muted-foreground text-pretty">Customize your BusRoute experience</p>
      </div>

      <div className="space-y-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Bus Arrivals</p>
                <p className="text-sm text-muted-foreground">Get notified when your bus is approaching</p>
              </div>
              <Switch
                checked={notifications.busArrivals}
                onCheckedChange={(checked) => handleNotificationChange("busArrivals", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Route Updates</p>
                <p className="text-sm text-muted-foreground">Receive updates about route changes and delays</p>
              </div>
              <Switch
                checked={notifications.routeUpdates}
                onCheckedChange={(checked) => handleNotificationChange("routeUpdates", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Service Alerts</p>
                <p className="text-sm text-muted-foreground">Important service disruptions and announcements</p>
              </div>
              <Switch
                checked={notifications.serviceAlerts}
                onCheckedChange={(checked) => handleNotificationChange("serviceAlerts", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Promotions</p>
                <p className="text-sm text-muted-foreground">Special offers and discounts</p>
              </div>
              <Switch
                checked={notifications.promotions}
                onCheckedChange={(checked) => handleNotificationChange("promotions", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Default Location
                </p>
                <p className="text-sm text-muted-foreground">Starting point for route searches</p>
              </div>
              <Select
                value={preferences.defaultLocation}
                onValueChange={(value) => handlePreferenceChange("defaultLocation", value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Use Current Location</SelectItem>
                  <SelectItem value="home">Home Address</SelectItem>
                  <SelectItem value="work">Work Address</SelectItem>
                  <SelectItem value="none">No Default</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Language
                </p>
                <p className="text-sm text-muted-foreground">App display language</p>
              </div>
              <Select value={preferences.language} onValueChange={(value) => handlePreferenceChange("language", value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Units</p>
                <p className="text-sm text-muted-foreground">Distance and time display format</p>
              </div>
              <Select value={preferences.units} onValueChange={(value) => handlePreferenceChange("units", value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Metric (km, m)</SelectItem>
                  <SelectItem value="imperial">Imperial (mi, ft)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Theme
                </p>
                <p className="text-sm text-muted-foreground">App appearance</p>
              </div>
              <Select value={preferences.theme} onValueChange={(value) => handlePreferenceChange("theme", value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System Default</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Walking Distance
                  </p>
                  <p className="text-sm text-muted-foreground">Maximum walking distance to bus stops</p>
                </div>
                <Badge variant="secondary">{walkingDistance[0]}m</Badge>
              </div>
              <Slider
                value={walkingDistance}
                onValueChange={setWalkingDistance}
                max={2000}
                min={200}
                step={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>200m</span>
                <span>2000m</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Location Tracking</p>
                <p className="text-sm text-muted-foreground">
                  Allow app to access your location for better route suggestions
                </p>
              </div>
              <Switch
                checked={privacy.locationTracking}
                onCheckedChange={(checked) => handlePrivacyChange("locationTracking", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Data Sharing</p>
                <p className="text-sm text-muted-foreground">Share anonymized usage data to improve service</p>
              </div>
              <Switch
                checked={privacy.dataSharing}
                onCheckedChange={(checked) => handlePrivacyChange("dataSharing", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Analytics</p>
                <p className="text-sm text-muted-foreground">Help us improve the app with usage analytics</p>
              </div>
              <Switch
                checked={privacy.analytics}
                onCheckedChange={(checked) => handlePrivacyChange("analytics", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Support & Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Support & Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help & FAQ
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Info className="h-4 w-4 mr-2" />
              About BusRoute
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              <Shield className="h-4 w-4 mr-2" />
              Privacy Policy
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent">
              Terms of Service
            </Button>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-center pt-4">
          <Button size="lg" className="px-8">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}

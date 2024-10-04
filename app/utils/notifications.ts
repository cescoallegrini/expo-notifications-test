import Constants from "expo-constants"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"

export type NotificationType = "PRODUCT_SOLD" | "OTHER"

export type Notification = {
  created_at: number
  message: string
  title: string
  type: NotificationType
  uniqid: string
  /**
   * Programmatically added inside `setNotificationHandler` in `App.tsx`.
   * This field will never come from the API.
   */
  isLocal?: boolean
}

export type IosNotification = {
  aps: {
    "thread-id": string
    category: string
    "content-available": number // 0 | 1
    sound: "default" | null
    alert: {
      subtitle: string
      title: string
      "launch-image": string
      body: string
    }
  }
  scopeKey: string
  projectId: string
  experienceId: string
  body: Notification
}

export async function registerForPushNotificationsAsync() {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: true,
        }
      })
      finalStatus = status
    }
    if (finalStatus !== "granted") {
      throw new Error("Notifications: permission not granted")
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId
    if (!projectId) {
      throw new Error("Notifications: project ID not found")
    }

    try {
      const pushTokenString = await Notifications.getExpoPushTokenAsync({
        projectId,
      })

      return pushTokenString.data
    } catch (e: unknown) {
      throw new Error(`Notifications: getExpoPushTokenAsync error => ${e}`)
    }
  } else {
    throw new Error("Notifications: must use physical device")
  }
}

export async function getNotificationsToken() {
  let token

  try {
    token = await registerForPushNotificationsAsync()
  } catch (error) {
    token = null
  }

  return token
}

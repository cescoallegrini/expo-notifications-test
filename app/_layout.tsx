import { useFonts } from 'expo-font'
import * as Notifications from 'expo-notifications'
import * as SplashScreen from 'expo-splash-screen'
import * as TaskManager from 'expo-task-manager'
import React, { useEffect, useState } from 'react'
import 'react-native-reanimated'
import { getNotificationsToken, IosNotification, Notification, NotificationType } from './utils/notifications'
import { isIos } from './utils/platform'
import { log } from './utils/logs'
import { AppState, Text, View } from 'react-native'

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const customSoundNotificationTypes: NotificationType[] = ["PRODUCT_SOLD"]
const BACKGROUND_NOTIFICATIONS_TASK = "com.cescoallegrini.notificationstest.backgroundNotificationsTask"

TaskManager.defineTask(BACKGROUND_NOTIFICATIONS_TASK, async ({ data, error, executionInfo }) => {
  log("BACKGROUND_NOTIFICATIONS_TASK", data, error, executionInfo)
  if (isIos) {
    const content = data as IosNotification

    if (customSoundNotificationTypes.includes(content?.body?.type) && !content.body.isLocal) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: content.aps?.alert?.title,
          body: content.aps?.alert?.body,
          sound: "notification.wav",
          data: {
            ...content.body,
            isLocal: true,
          }
        },
        trigger: null,
      })
    }
  }
})

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATIONS_TASK)

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const content = notification.request.content
    const data = notification.request.content.data as Notification

    /**
     * Remote notifications with custom sounds are not supported on iOS,
     * so when receiving one, we hide them and schedule a local notification
     * since they support custom sounds.
     */
    if (isIos) {
      log("setNotificationHandler.handleNotification\n", content)
      if (data && customSoundNotificationTypes.includes(data.type) && !data.isLocal) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: content.title,
            body: content.body,
            sound: "notification.wav",
            data: {
              ...data,
              isLocal: true,
            }
          },
          trigger: null,
        })

        return {
          shouldShowAlert: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }
      }
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }
  },
  handleError: (id, error) => {
    log("setNotificationHandler.handleError", id, error)
  },
})

export default function RootLayout() {
  const [token, setToken] = useState("")

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  })

  const lastNotificationResponse = Notifications.useLastNotificationResponse()

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  useEffect(() => {
    console.log("useLastNotificationResponse", lastNotificationResponse ? JSON.stringify(lastNotificationResponse, null, 2) : lastNotificationResponse)
  }, [lastNotificationResponse])

  useEffect(() => {
    (async() => {
      console.log("TOKEN", await getNotificationsToken())
    })()

    const appStateSubscription = AppState.addEventListener("change", (state) => {
      console.log("AppState changed to", state)
    })

    const receivedListener = Notifications.addNotificationReceivedListener(notification => {
      log("NotificationReceivedListener", notification.request.content)
    })

    const responseReceivedListener = Notifications.addNotificationResponseReceivedListener(notification => {
      log("NotificationResponseReceivedListener", notification.notification.request.content)
    })

    return () => {
      log("Removing notification listeners")
      appStateSubscription.remove()
      Notifications.removeNotificationSubscription(receivedListener)
      Notifications.removeNotificationSubscription(responseReceivedListener)
    }
  }, [])

  if (!loaded) {
    return null
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", backgroundColor: "white" }}>
      <Text style={{ color: "black" }}>{token}</Text>
    </View>
  )
}

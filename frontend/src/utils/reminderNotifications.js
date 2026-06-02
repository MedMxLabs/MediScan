/** Browser notification helpers for medicine reminders (web). */
export async function ensureNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  return Notification.requestPermission()
}

export function scheduleWebReminderNotifications(reminders) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const prefs = (() => {
    try {
      return JSON.parse(localStorage.getItem('medscan_notify_prefs') || '{}')
    } catch {
      return {}
    }
  })()
  if (prefs.enabled === false) return

  const now = Date.now()
  for (const r of reminders) {
    if (!r.active && r.enabled !== true && r.status !== 'active') continue
    const trigger = r.raw?.next_trigger || r.next_trigger
    if (!trigger) continue
    const when = new Date(trigger).getTime()
    const delay = when - now
    if (delay <= 0 || delay > 24 * 60 * 60 * 1000) continue
    const key = `medscan-web-rem-${r.id}-${trigger}`
    if (sessionStorage.getItem(key)) continue
    sessionStorage.setItem(key, '1')
    window.setTimeout(() => {
      try {
        new Notification(`Reminder: ${r.name || r.medicine_name}`, {
          body: r.dose ? `Time to take ${r.dose}` : 'Medicine dose due',
          tag: key,
        })
      } catch {
        /* ignore */
      }
    }, delay)
  }
}

export function saveWebNotifyPref(enabled) {
  localStorage.setItem(
    'medscan_notify_prefs',
    JSON.stringify({ enabled: Boolean(enabled), updatedAt: Date.now() }),
  )
}

export function loadWebNotifyPref() {
  try {
    const raw = JSON.parse(localStorage.getItem('medscan_notify_prefs') || '{}')
    return raw.enabled !== false
  } catch {
    return true
  }
}

export interface Meta {
  version: string
  display_name: string
  created_at: string
  notifications: {
    morning_time: string  // HH:MM
    evening_time: string  // HH:MM
  }
  last_synced_at: string
  fcm_token?: string
}

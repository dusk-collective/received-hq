export interface Property {
  id: string
  name: string
  address: string | null
  phone: string | null
  created_at: string
  owner_id: string
  storage_fee_enabled: boolean
  storage_fee_amount: number
  notification_template: string | null
  pickup_instructions: string | null
}

export interface Staff {
  id: string
  user_id: string
  property_id: string
  name: string
  role: 'clerk' | 'manager' | 'admin'
  created_at: string
}

export interface StaffInvite {
  id: string
  property_id: string
  email: string
  role: 'clerk' | 'manager' | 'admin'
  invited_by: string
  created_at: string
  accepted_at: string | null
}

export type CarrierType = 'FedEx' | 'UPS' | 'USPS' | 'Amazon' | 'DHL' | 'Other'
export type RecipientType = 'guest' | 'employee' | 'vendor' | 'group'
export type PackageStatus = 'received' | 'notified' | 'picked_up' | 'returned' | 'missing'
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'no_contact'

export interface Package {
  id: string
  property_id: string
  tracking_number: string | null
  carrier: CarrierType | null
  recipient_name: string
  recipient_type: RecipientType
  room_number: string | null
  status: PackageStatus
  storage_location: string | null
  storage_photo_url: string | null
  notes: string | null
  guest_email: string | null
  guest_phone: string | null
  checkout_date: string | null
  notification_status: NotificationStatus
  notified_at: string | null
  storage_fee_charged: boolean
  received_by: string | null
  received_at: string
  picked_up_at: string | null
  picked_up_by: string | null
  label_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface PackageEvent {
  id: string
  package_id: string
  event_type: string
  details: Record<string, unknown> | null
  created_by: string | null
  created_at: string
}

export interface ScanResult {
  tracking_number: string | null
  carrier: string | null
  recipient_name: string | null
}

export interface Property {
  id: string
  name: string
  address: string | null
  created_at: string
  owner_id: string
}

export interface Staff {
  id: string
  user_id: string
  property_id: string
  name: string
  role: 'clerk' | 'manager' | 'admin'
  created_at: string
}

export interface Package {
  id: string
  property_id: string
  tracking_number: string | null
  carrier: 'FedEx' | 'UPS' | 'USPS' | 'Amazon' | 'DHL' | 'Other' | null
  recipient_name: string
  recipient_type: 'guest' | 'employee' | 'vendor' | 'group'
  room_number: string | null
  status: 'received' | 'notified' | 'picked_up' | 'returned' | 'missing'
  storage_location: string | null
  storage_photo_url: string | null
  notes: string | null
  received_by: string | null
  received_at: string
  picked_up_at: string | null
  picked_up_by: string | null
  label_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ScanResult {
  tracking_number: string | null
  carrier: string | null
  recipient_name: string | null
}

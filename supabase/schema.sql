-- Received HQ — Database Schema
-- Run this in the Supabase SQL Editor

-- Properties (hotels/buildings)
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  owner_id UUID REFERENCES auth.users(id)
);

-- Staff members (users linked to a property)
CREATE TABLE staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  property_id UUID REFERENCES properties(id) NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'clerk', -- clerk, manager, admin
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Packages
CREATE TABLE packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) NOT NULL,
  tracking_number TEXT,
  carrier TEXT, -- FedEx, UPS, USPS, Amazon, DHL, Other
  recipient_name TEXT NOT NULL,
  recipient_type TEXT DEFAULT 'guest', -- guest, employee, vendor, group
  room_number TEXT,
  status TEXT DEFAULT 'received', -- received, notified, picked_up, returned, missing
  storage_location TEXT,
  storage_photo_url TEXT,
  notes TEXT,
  received_by UUID REFERENCES staff(id),
  received_at TIMESTAMPTZ DEFAULT now(),
  picked_up_at TIMESTAMPTZ,
  picked_up_by TEXT, -- name of person who picked up
  label_data JSONB, -- raw AI extraction data
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own properties" ON properties
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Staff can view their property" ON staff
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Staff can manage packages for their property" ON packages
  FOR ALL USING (
    property_id IN (SELECT property_id FROM staff WHERE user_id = auth.uid())
  );

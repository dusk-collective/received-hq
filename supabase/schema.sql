-- Received HQ — Database Schema
-- Run this in the Supabase SQL Editor

-- Properties (hotels/buildings)
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  owner_id UUID REFERENCES auth.users(id),
  storage_fee_enabled BOOLEAN DEFAULT false,
  storage_fee_amount DECIMAL(10,2) DEFAULT 5.00,
  notification_template TEXT DEFAULT 'Hello {{guest_name}}, your package from {{carrier}} has arrived at {{property_name}}. {{pickup_location}} Tracking: {{tracking_number}}',
  pickup_instructions TEXT DEFAULT 'Please visit the front desk for pickup.'
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

-- Staff invites
CREATE TABLE staff_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'clerk',
  invited_by UUID REFERENCES staff(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ
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
  guest_email TEXT,
  guest_phone TEXT,
  checkout_date DATE,
  notification_status TEXT DEFAULT 'pending', -- pending, sent, failed, no_contact
  notified_at TIMESTAMPTZ,
  storage_fee_charged BOOLEAN DEFAULT false,
  received_by UUID REFERENCES staff(id),
  received_at TIMESTAMPTZ DEFAULT now(),
  picked_up_at TIMESTAMPTZ,
  picked_up_by TEXT, -- name of person who picked up
  label_data JSONB, -- raw AI extraction data
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Package events (audit trail)
CREATE TABLE package_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- status_change, notification_sent, edited, created, picked_up
  details JSONB,
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Properties: staff can read their property, only owner/admin can update
CREATE POLICY "staff_can_read_property" ON properties
  FOR SELECT USING (
    id IN (SELECT property_id FROM staff WHERE user_id = auth.uid())
  );

CREATE POLICY "owner_or_admin_can_update_property" ON properties
  FOR UPDATE USING (
    owner_id = auth.uid()
    OR id IN (
      SELECT property_id FROM staff
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "owner_can_insert_property" ON properties
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owner_can_delete_property" ON properties
  FOR DELETE USING (owner_id = auth.uid());

-- Staff: all staff can see colleagues at same property
CREATE POLICY "staff_can_see_property_colleagues" ON staff
  FOR SELECT USING (
    property_id IN (SELECT property_id FROM staff WHERE user_id = auth.uid())
  );

-- Staff: block all direct inserts (must go through bootstrap_tenant RPC or invite acceptance RPC)
CREATE POLICY "staff_insert_blocked" ON staff
  FOR INSERT WITH CHECK (FALSE);

-- Staff: users can update only their own name (not role or property_id)
CREATE POLICY "staff_update_own_name" ON staff
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND property_id = (SELECT s.property_id FROM staff s WHERE s.id = staff.id)
    AND role = (SELECT s.role FROM staff s WHERE s.id = staff.id)
  );

-- Staff: manager/admin can update staff at their property (including role changes)
CREATE POLICY "managers_can_update_staff" ON staff
  FOR UPDATE USING (
    property_id IN (
      SELECT s.property_id FROM staff s
      WHERE s.user_id = auth.uid() AND s.role IN ('manager', 'admin')
    )
  );

-- Staff: only admin can delete staff (not themselves)
CREATE POLICY "admin_can_delete_staff" ON staff
  FOR DELETE USING (
    user_id != auth.uid()
    AND property_id IN (
      SELECT s.property_id FROM staff s
      WHERE s.user_id = auth.uid() AND s.role = 'admin'
    )
  );

-- Packages: all staff can SELECT and INSERT
CREATE POLICY "staff_can_select_packages" ON packages
  FOR SELECT USING (
    property_id IN (SELECT property_id FROM staff WHERE user_id = auth.uid())
  );

CREATE POLICY "staff_can_insert_packages" ON packages
  FOR INSERT WITH CHECK (
    property_id IN (SELECT property_id FROM staff WHERE user_id = auth.uid())
  );

-- Packages: all staff at the property can UPDATE (clerks need to mark pickups, update status)
CREATE POLICY "staff_can_update_packages" ON packages
  FOR UPDATE USING (
    property_id IN (
      SELECT property_id FROM staff WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    property_id IN (
      SELECT property_id FROM staff WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "managers_and_admins_can_delete_packages" ON packages
  FOR DELETE USING (
    property_id IN (
      SELECT property_id FROM staff
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

-- Package events: all staff can SELECT and INSERT
CREATE POLICY "staff_can_select_package_events" ON package_events
  FOR SELECT USING (
    package_id IN (
      SELECT p.id FROM packages p
      JOIN staff s ON s.property_id = p.property_id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "staff_can_insert_package_events" ON package_events
  FOR INSERT WITH CHECK (
    package_id IN (
      SELECT p.id FROM packages p
      JOIN staff s ON s.property_id = p.property_id
      WHERE s.user_id = auth.uid()
    )
  );

-- Package events: only manager/admin can UPDATE and DELETE
CREATE POLICY "managers_and_admins_can_update_package_events" ON package_events
  FOR UPDATE USING (
    package_id IN (
      SELECT p.id FROM packages p
      JOIN staff s ON s.property_id = p.property_id
      WHERE s.user_id = auth.uid()
      AND s.role IN ('manager', 'admin')
    )
  );

CREATE POLICY "managers_and_admins_can_delete_package_events" ON package_events
  FOR DELETE USING (
    package_id IN (
      SELECT p.id FROM packages p
      JOIN staff s ON s.property_id = p.property_id
      WHERE s.user_id = auth.uid()
      AND s.role IN ('manager', 'admin')
    )
  );

-- Staff invites: all staff can SELECT (see pending invites)
CREATE POLICY "staff_can_view_invites" ON staff_invites
  FOR SELECT USING (
    property_id IN (SELECT property_id FROM staff WHERE user_id = auth.uid())
  );

-- Staff invites: only manager/admin can INSERT, UPDATE, DELETE
CREATE POLICY "managers_and_admins_can_insert_invites" ON staff_invites
  FOR INSERT WITH CHECK (
    property_id IN (
      SELECT property_id FROM staff
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "managers_and_admins_can_update_invites" ON staff_invites
  FOR UPDATE USING (
    property_id IN (
      SELECT property_id FROM staff
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

CREATE POLICY "managers_and_admins_can_delete_invites" ON staff_invites
  FOR DELETE USING (
    property_id IN (
      SELECT property_id FROM staff
      WHERE user_id = auth.uid()
      AND role IN ('manager', 'admin')
    )
  );

-- CHECK constraints
ALTER TABLE staff ADD CONSTRAINT valid_role CHECK (role IN ('clerk', 'manager', 'admin'));
ALTER TABLE packages ADD CONSTRAINT valid_status CHECK (status IN ('received', 'notified', 'picked_up', 'returned', 'missing'));
ALTER TABLE packages ADD CONSTRAINT valid_recipient_type CHECK (recipient_type IN ('guest', 'employee', 'vendor', 'group'));
ALTER TABLE packages ADD CONSTRAINT valid_notification_status CHECK (notification_status IN ('pending', 'sent', 'failed', 'no_contact') OR notification_status IS NULL);
ALTER TABLE properties ADD CONSTRAINT non_negative_storage_fee CHECK (storage_fee_amount >= 0 OR storage_fee_amount IS NULL);

-- Migration SQL (run on existing databases):
-- ALTER TABLE properties ADD COLUMN IF NOT EXISTS phone TEXT;
-- ALTER TABLE properties ADD COLUMN IF NOT EXISTS storage_fee_enabled BOOLEAN DEFAULT false;
-- ALTER TABLE properties ADD COLUMN IF NOT EXISTS storage_fee_amount DECIMAL(10,2) DEFAULT 5.00;
-- ALTER TABLE properties ADD COLUMN IF NOT EXISTS notification_template TEXT DEFAULT 'Hello {{guest_name}}, your package from {{carrier}} has arrived at {{property_name}}. {{pickup_location}} Tracking: {{tracking_number}}';
-- ALTER TABLE properties ADD COLUMN IF NOT EXISTS pickup_instructions TEXT DEFAULT 'Please visit the front desk for pickup.';
-- ALTER TABLE packages ADD COLUMN IF NOT EXISTS guest_email TEXT;
-- ALTER TABLE packages ADD COLUMN IF NOT EXISTS guest_phone TEXT;
-- ALTER TABLE packages ADD COLUMN IF NOT EXISTS checkout_date DATE;
-- ALTER TABLE packages ADD COLUMN IF NOT EXISTS notification_status TEXT DEFAULT 'pending';
-- ALTER TABLE packages ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;
-- ALTER TABLE packages ADD COLUMN IF NOT EXISTS storage_fee_charged BOOLEAN DEFAULT false;
-- CREATE TABLE IF NOT EXISTS staff_invites (...);
-- CREATE TABLE IF NOT EXISTS package_events (...);

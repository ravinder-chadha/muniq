-- STEP-BY-STEP Slot Management Setup
-- Run each step separately in Supabase SQL Editor
-- Wait for each step to complete before running the next

-- ===============================
-- STEP 1: Add slot column to registrations table
-- ===============================
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS workshop_slot VARCHAR(20) DEFAULT '2-4pm';

-- Add constraint for valid slot values
ALTER TABLE registrations 
DROP CONSTRAINT IF EXISTS check_workshop_slot;

ALTER TABLE registrations 
ADD CONSTRAINT check_workshop_slot CHECK (workshop_slot IN ('2-4pm', '4-6pm'));


-- ===============================
-- STEP 2: Update existing registrations
-- ===============================
UPDATE registrations 
SET workshop_slot = '2-4pm' 
WHERE workshop_slot IS NULL;


-- ===============================
-- STEP 3: Add index for performance
-- ===============================
CREATE INDEX IF NOT EXISTS idx_registrations_workshop_slot ON registrations(workshop_slot);


-- ===============================
-- STEP 4: Create slot statistics view
-- ===============================
CREATE OR REPLACE VIEW slot_statistics AS
SELECT 
    workshop_slot,
    COUNT(*) as total_registrations,
    COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as paid_registrations,
    COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_registrations,
    COUNT(CASE WHEN p.status IS NULL THEN 1 END) as unpaid_registrations,
    SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_revenue
FROM registrations r
LEFT JOIN payments p ON r.id = p.registration_id
GROUP BY workshop_slot
ORDER BY workshop_slot;


-- ===============================
-- STEP 5: Recreate payment_details view
-- ===============================
DROP VIEW IF EXISTS payment_details;

CREATE VIEW payment_details AS
SELECT 
    p.id as payment_id,
    p.payment_id as razorpay_payment_id,
    p.order_id,
    p.amount,
    p.currency,
    p.status,
    p.payment_method,
    p.payment_screenshot_url,
    p.created_at as payment_date,
    r.id as registration_id,
    r.first_name,
    r.last_name,
    r.email,
    r.contact,
    r.standard,
    r.institution,
    r.mun_experience,
    r.workshop_slot,
    r.created_at as registration_date
FROM payments p
JOIN registrations r ON p.registration_id = r.id
ORDER BY p.created_at DESC;


-- ===============================
-- STEP 6: Grant permissions
-- ===============================
GRANT SELECT ON slot_statistics TO service_role;
GRANT SELECT ON payment_details TO service_role;


-- ===============================
-- STEP 7: Create slot_config table (optional - for tracking only)
-- ===============================
DROP TABLE IF EXISTS slot_config CASCADE;

CREATE TABLE slot_config (
    slot_name VARCHAR(20) PRIMARY KEY,
    current_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ===============================
-- STEP 8: Insert slot configurations (no capacity limits)
-- ===============================
INSERT INTO slot_config (slot_name, is_active, current_count) VALUES 
('2-4pm', false, 0),  -- Closed slot (no new registrations)
('4-6pm', true, 0);   -- Active slot (unlimited capacity)


-- ===============================
-- STEP 9: Update slot counts
-- ===============================
UPDATE slot_config SET current_count = (
    SELECT COUNT(*) FROM registrations 
    WHERE workshop_slot = '2-4pm'
) WHERE slot_name = '2-4pm';

UPDATE slot_config SET current_count = (
    SELECT COUNT(*) FROM registrations 
    WHERE workshop_slot = '4-6pm'
) WHERE slot_name = '4-6pm';


-- ===============================
-- STEP 10: Verification queries
-- ===============================
SELECT 'Step completed successfully!' as status;

-- Check registrations by slot
SELECT workshop_slot, COUNT(*) as count 
FROM registrations 
GROUP BY workshop_slot 
ORDER BY workshop_slot;

-- Check slot config
SELECT * FROM slot_config ORDER BY slot_name;

-- Check slot statistics
SELECT * FROM slot_statistics ORDER BY workshop_slot; 
-- Add slot management to registrations table
-- Run this script in your Supabase SQL Editor

-- 1. Add slot column to registrations table
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS workshop_slot VARCHAR(20) DEFAULT '2-4pm' CHECK (workshop_slot IN ('2-4pm', '4-6pm'));

-- 2. Update all existing registrations to be assigned to the 2-4pm slot
UPDATE registrations 
SET workshop_slot = '2-4pm' 
WHERE workshop_slot IS NULL OR workshop_slot = '2-4pm';

-- 3. Add index for better performance when filtering by slot
CREATE INDEX IF NOT EXISTS idx_registrations_workshop_slot ON registrations(workshop_slot);

-- 4. Create view for slot statistics
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

-- 5. Update the payment_details view to include slot information
CREATE OR REPLACE VIEW payment_details AS
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

-- 6. Grant access to new views
GRANT SELECT ON slot_statistics TO service_role;
GRANT SELECT ON payment_details TO service_role;

-- 7. Add slot capacity limits (optional - for future use)
CREATE TABLE IF NOT EXISTS slot_config (
    slot_name VARCHAR(20) PRIMARY KEY,
    max_capacity INTEGER NOT NULL DEFAULT 50,
    current_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert slot configurations
INSERT INTO slot_config (slot_name, max_capacity, is_active) VALUES 
('2-4pm', 50, false),  -- Closed slot
('4-6pm', 50, true)    -- New active slot
ON CONFLICT (slot_name) DO UPDATE SET 
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 8. Function to update current count (for future use)
CREATE OR REPLACE FUNCTION update_slot_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE slot_config 
        SET current_count = (
            SELECT COUNT(*) FROM registrations 
            WHERE workshop_slot = NEW.workshop_slot
        )
        WHERE slot_name = NEW.workshop_slot;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE slot_config 
        SET current_count = (
            SELECT COUNT(*) FROM registrations 
            WHERE workshop_slot = OLD.workshop_slot
        )
        WHERE slot_name = OLD.workshop_slot;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update slot counts
DROP TRIGGER IF EXISTS trigger_update_slot_count ON registrations;
CREATE TRIGGER trigger_update_slot_count
    AFTER INSERT OR DELETE ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_slot_count();

-- 9. Update current counts for existing data
UPDATE slot_config SET current_count = (
    SELECT COUNT(*) FROM registrations WHERE workshop_slot = '2-4pm'
) WHERE slot_name = '2-4pm';

UPDATE slot_config SET current_count = (
    SELECT COUNT(*) FROM registrations WHERE workshop_slot = '4-6pm'
) WHERE slot_name = '4-6pm';

-- 10. Query examples for checking data:

-- View all registrations by slot
-- SELECT workshop_slot, COUNT(*) as count FROM registrations GROUP BY workshop_slot;

-- View slot statistics
-- SELECT * FROM slot_statistics;

-- View slot configurations
-- SELECT * FROM slot_config; 
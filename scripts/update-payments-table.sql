-- Update payments table to include screenshot and payment method fields
-- Run this script against your Supabase database

-- Add new columns to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'razorpay' CHECK (payment_method IN ('razorpay', 'qr_code', 'manual'));

-- Update existing records to have default payment method
UPDATE payments 
SET payment_method = 'razorpay' 
WHERE payment_method IS NULL;

-- Add index for better performance when filtering by payment method
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);

-- Add index for screenshot URL (useful for admin queries)
CREATE INDEX IF NOT EXISTS idx_payments_screenshot_url ON payments(payment_screenshot_url);

-- Create view for admin to see payments with registration details
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
    r.created_at as registration_date
FROM payments p
JOIN registrations r ON p.registration_id = r.id
ORDER BY p.created_at DESC;

-- Grant access to the view for service role
GRANT SELECT ON payment_details TO service_role;

COMMENT ON TABLE payments IS 'Payment records with support for both Razorpay and QR code payments';
COMMENT ON COLUMN payments.payment_screenshot_url IS 'URL to uploaded payment screenshot for QR code payments';
COMMENT ON COLUMN payments.payment_method IS 'Payment method used: razorpay, qr_code, or manual'; 
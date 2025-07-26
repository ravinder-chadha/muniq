-- Update registrations table to support course information
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS course_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS course_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS course_price DECIMAL(10,2);

-- Update payments table to support course information  
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS course_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS course_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS course_details JSONB;

-- Create index on course_id for better query performance
CREATE INDEX IF NOT EXISTS idx_registrations_course_id ON registrations(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_course_id ON payments(course_id);

-- Update existing records (if any) to have default course information
UPDATE registrations 
SET 
  course_id = 'workshop',
  course_name = 'Beginner Workshop',
  course_price = 499.00
WHERE course_id IS NULL;

UPDATE payments 
SET 
  course_id = 'workshop',
  course_name = 'Beginner Workshop',
  course_details = '{"id": "workshop", "name": "Beginner Workshop", "price": 499, "originalPrice": 499}'::jsonb
WHERE course_id IS NULL;

-- Create a view for complete registration information
CREATE OR REPLACE VIEW registration_with_payment AS
SELECT 
  r.*,
  p.payment_id,
  p.order_id,
  p.signature,
  p.amount as payment_amount,
  p.status as payment_status,
  p.payment_method,
  p.created_at as payment_created_at
FROM registrations r
LEFT JOIN payments p ON r.id = p.registration_id;

COMMENT ON TABLE registrations IS 'User registrations for various MUNIQ courses';
COMMENT ON TABLE payments IS 'Payment records linked to registrations';
COMMENT ON VIEW registration_with_payment IS 'Complete registration and payment information'; 
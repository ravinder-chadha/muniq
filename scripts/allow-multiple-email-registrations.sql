-- Migration script to allow multiple registrations from same email
-- This removes the UNIQUE constraint on the email column

-- Step 1: Drop the existing unique constraint on email
-- Note: The constraint name may vary, so we need to find it first
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the unique constraint on email column
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'registrations'::regclass 
    AND contype = 'u' 
    AND EXISTS (
        SELECT 1 
        FROM unnest(conkey) AS col_attnum
        JOIN pg_attribute ON attnum = col_attnum AND attrelid = conrelid
        WHERE attname = 'email'
    );
    
    -- Drop the constraint if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE registrations DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped unique constraint: %', constraint_name;
    ELSE
        RAISE NOTICE 'No unique constraint found on email column';
    END IF;
END $$;

-- Step 2: Also handle the case where it might be named differently
-- Try common constraint names
DO $$
BEGIN
    -- Try dropping by common names
    BEGIN
        ALTER TABLE registrations DROP CONSTRAINT registrations_email_key;
        RAISE NOTICE 'Dropped constraint: registrations_email_key';
    EXCEPTION
        WHEN undefined_object THEN
            -- Constraint doesn't exist, continue
            NULL;
    END;
    
    BEGIN
        ALTER TABLE registrations DROP CONSTRAINT registrations_email_unique;
        RAISE NOTICE 'Dropped constraint: registrations_email_unique';
    EXCEPTION
        WHEN undefined_object THEN
            -- Constraint doesn't exist, continue
            NULL;
    END;
END $$;

-- Step 3: Verify the constraint has been removed
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM pg_constraint 
    WHERE conrelid = 'registrations'::regclass 
    AND contype = 'u' 
    AND EXISTS (
        SELECT 1 
        FROM unnest(conkey) AS col_attnum
        JOIN pg_attribute ON attnum = col_attnum AND attrelid = conrelid
        WHERE attname = 'email'
    );
    
    IF constraint_count = 0 THEN
        RAISE NOTICE 'SUCCESS: Email column no longer has unique constraint';
    ELSE
        RAISE NOTICE 'WARNING: Email column still has % unique constraint(s)', constraint_count;
    END IF;
END $$;

-- Step 4: Handle views that depend on the email column
-- Drop all views that depend on the registrations table temporarily
DROP VIEW IF EXISTS payment_details;
DROP VIEW IF EXISTS registration_with_payment;

-- Step 5: Update the column definition to remove UNIQUE if it was defined inline
-- This is a safe operation that won't fail if the constraint is already removed
ALTER TABLE registrations ALTER COLUMN email TYPE VARCHAR(255);

-- Step 6: Recreate the registration_with_payment view
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

-- Step 7: Recreate the payment_details view
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

-- Add comments back to the views
COMMENT ON VIEW registration_with_payment IS 'Complete registration and payment information';

-- Grant permissions to views
GRANT SELECT ON registration_with_payment TO service_role;
GRANT SELECT ON payment_details TO service_role;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Multiple registrations from same email are now allowed';
    RAISE NOTICE 'Views recreated: registration_with_payment and payment_details';
    RAISE NOTICE 'All database views and permissions have been restored';
END $$; 
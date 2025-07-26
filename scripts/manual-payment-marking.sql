-- MANUAL PAYMENT MARKING SCRIPT
-- Use this to manually mark registrations as paid by email ID

-- ===============================
-- STEP 1: Check existing registrations and their payment status
-- ===============================
SELECT 'Current registration and payment status:' as info;
SELECT 
    r.id,
    r.first_name,
    r.last_name,
    r.email,
    r.workshop_slot,
    CASE 
        WHEN p.id IS NOT NULL THEN 'HAS PAYMENT'
        ELSE 'NO PAYMENT'
    END as payment_status,
    p.payment_method,
    p.status as payment_status_detail,
    p.amount
FROM registrations r
LEFT JOIN payments p ON r.id = p.registration_id
ORDER BY r.created_at DESC;

-- ===============================
-- STEP 2: MANUAL PAYMENT INSERTION
-- Replace the email addresses below with the ones you want to mark as paid
-- ===============================

-- EXAMPLE: Mark specific registrations as paid
-- REPLACE THESE EMAIL ADDRESSES WITH THE ACTUAL ONES:
INSERT INTO payments (
    registration_id,
    payment_id,
    amount,
    currency,
    status,
    payment_method,
    created_at
)
SELECT 
    r.id,
    'manual_' || EXTRACT(EPOCH FROM NOW())::bigint || '_' || SUBSTRING(r.id, 1, 8) as payment_id,
    11.00 as amount,
    'INR' as currency,
    'completed' as status,
    'manual' as payment_method,
    NOW() as created_at
FROM registrations r
WHERE r.email IN (
    -- ADD EMAIL ADDRESSES HERE (one per line, in single quotes, separated by commas)
    'example1@email.com',
    'example2@email.com',
    'example3@email.com'
    -- Add more emails as needed
)
AND NOT EXISTS (
    -- Only insert if payment doesn't already exist
    SELECT 1 FROM payments p WHERE p.registration_id = r.id
);

-- ===============================
-- STEP 3: Verify the manual payments were created
-- ===============================
SELECT 'Manual payments created:' as info;
SELECT 
    r.first_name,
    r.last_name,
    r.email,
    r.workshop_slot,
    p.payment_id,
    p.payment_method,
    p.status,
    p.amount,
    p.created_at
FROM registrations r
JOIN payments p ON r.id = p.registration_id
WHERE p.payment_method = 'manual'
ORDER BY p.created_at DESC;

-- ===============================
-- ALTERNATIVE: Mark ALL unpaid registrations as paid (DANGEROUS - USE CAREFULLY)
-- ===============================
-- Uncomment the lines below ONLY if you want to mark ALL unpaid registrations as paid

/*
INSERT INTO payments (
    registration_id,
    payment_id,
    amount,
    currency,
    status,
    payment_method,
    created_at
)
SELECT 
    r.id,
    'manual_bulk_' || EXTRACT(EPOCH FROM NOW())::bigint || '_' || SUBSTRING(r.id, 1, 8) as payment_id,
    11.00 as amount,
    'INR' as currency,
    'completed' as status,
    'manual' as payment_method,
    NOW() as created_at
FROM registrations r
WHERE NOT EXISTS (
    SELECT 1 FROM payments p WHERE p.registration_id = r.id
);
*/

-- ===============================
-- STEP 4: Final verification query
-- ===============================
SELECT 'Final payment summary:' as info;
SELECT 
    payment_method,
    status,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM payments
GROUP BY payment_method, status
ORDER BY payment_method, status; 
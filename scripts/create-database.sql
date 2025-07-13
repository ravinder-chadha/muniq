-- Create registrations table for MUNIQ workshop
CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    contact VARCHAR(20),
    date_of_birth DATE,
    standard VARCHAR(50) NOT NULL,
    institution VARCHAR(255),
    mun_experience VARCHAR(50) NOT NULL,
    payment_id VARCHAR(255),
    order_id VARCHAR(255),
    payment_signature VARCHAR(255),
    amount DECIMAL(10,2),
    payment_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);

-- Create index on payment_id for payment tracking
CREATE INDEX IF NOT EXISTS idx_registrations_payment_id ON registrations(payment_id);

-- Insert sample data (optional)
INSERT INTO registrations (
    first_name, 
    last_name, 
    email, 
    contact, 
    standard, 
    institution, 
    mun_experience,
    amount,
    payment_status
) VALUES 
(
    'John', 
    'Doe', 
    'john.doe@example.com', 
    '+91 9876543210', 
    '12th', 
    'Delhi Public School', 
    'beginner',
    11.00,
    'completed'
);

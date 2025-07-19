import { createClient } from '@supabase/supabase-js'

// Database Types
export interface Registration {
  id?: string
  first_name: string
  last_name: string
  email: string
  contact?: string
  dob?: string
  standard: string
  institution?: string
  mun_experience: string
  workshop_slot?: '2-4pm' | '4-6pm'
  created_at?: string
  updated_at?: string
}

export interface Payment {
  id?: string
  registration_id: string
  payment_id: string
  order_id?: string
  signature?: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed'
  payment_screenshot_url?: string
  payment_method?: 'razorpay' | 'qr_code' | 'manual'
  created_at?: string
  updated_at?: string
}

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for frontend operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Database operations
export const db = {
  // Registration operations
  async createRegistration(data: Registration) {
    const { data: registration, error } = await supabaseAdmin
      .from('registrations')
      .insert([data])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating registration:', error)
      throw error
    }
    
    return registration
  },

  async getRegistration(id: string) {
    const { data, error } = await supabaseAdmin
      .from('registrations')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching registration:', error)
      throw error
    }
    
    return data
  },

  async getRegistrationByEmail(email: string) {
    const { data, error } = await supabaseAdmin
      .from('registrations')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching registration by email:', error)
      throw error
    }
    
    return data
  },

  // Payment operations
  async createPayment(data: Payment) {
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert([data])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating payment:', error)
      throw error
    }
    
    return payment
  },

  async updatePayment(id: string, data: Partial<Payment>) {
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating payment:', error)
      throw error
    }
    
    return payment
  },

  async getPayment(id: string) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching payment:', error)
      throw error
    }
    
    return data
  },

  async getPaymentByRegistration(registrationId: string) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('registration_id', registrationId)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching payment by registration:', error)
      throw error
    }
    
    return data
  },

  // Combined operations
  async getRegistrationWithPayment(email: string) {
    const { data, error } = await supabaseAdmin
      .from('registrations')
      .select(`
        *,
        payments (*)
      `)
      .eq('email', email)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching registration with payment:', error)
      throw error
    }
    
    return data
  }
} 
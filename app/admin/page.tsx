"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { checkAdminAuth, logout } from "@/lib/auth"
import {
  Database,
  Users,
  CreditCard,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
  Building,
  Trophy,
  LogOut,
  Shield,
} from "lucide-react"

interface Registration {
  id: string
  first_name: string
  last_name: string
  email: string
  contact?: string
  dob?: string
  standard: string
  institution?: string
  mun_experience: string
  created_at: string
  updated_at: string
}

interface Payment {
  id: string
  registration_id: string
  payment_id: string
  order_id?: string
  signature?: string
  amount: number
  currency: string
  status: string
  payment_screenshot_url?: string
  payment_method?: 'razorpay' | 'qr_code' | 'manual'
  created_at: string
  updated_at: string
  registrations?: {
    first_name: string
    last_name: string
    email: string
  }
}

export default function AdminPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  // Test database connection
  const testConnection = async () => {
    try {
      const response = await fetch('/api/test-db?action=connection')
      const data = await response.json()
      
      if (data.success) {
        setDbStatus('connected')
        toast({
          title: "Database Connected",
          description: "Successfully connected to Supabase database",
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      setDbStatus('error')
      toast({
        title: "Database Error",
        description: error instanceof Error ? error.message : "Failed to connect to database",
        variant: "destructive",
      })
    }
  }

  // Fetch registrations
  const fetchRegistrations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-db?action=registrations')
      const data = await response.json()
      
      if (data.success) {
        setRegistrations(data.data)
        toast({
          title: "Registrations Loaded",
          description: `Found ${data.count} registrations`,
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: "Error Loading Registrations",
        description: error instanceof Error ? error.message : "Failed to load registrations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch payments
  const fetchPayments = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-db?action=payments')
      const data = await response.json()
      
      if (data.success) {
        setPayments(data.data)
        toast({
          title: "Payments Loaded",
          description: `Found ${data.count} payments`,
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast({
        title: "Error Loading Payments",
        description: error instanceof Error ? error.message : "Failed to load payments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshAll = async () => {
    await testConnection()
    await fetchRegistrations()
    await fetchPayments()
  }

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true)
      const isAuth = await checkAdminAuth()
      
      if (!isAuth) {
        router.push('/admin/login')
        return
      }
      
      setIsAuthenticated(true)
      setAuthLoading(false)
      
      // Load data after authentication
      await refreshAll()
    }
    
    checkAuth()
  }, [router])

  const handleLogout = () => {
    logout()
  }

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDbStatusBadge = () => {
    switch (dbStatus) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Error</Badge>
      default:
        return <Badge variant="outline"><AlertCircle className="w-3 h-3 mr-1" />Unknown</Badge>
    }
  }

  const getPaymentStatusForRegistration = (registrationId: string) => {
    const payment = payments.find(p => p.registration_id === registrationId)
    if (!payment) {
      return { status: 'unpaid', payment: null }
    }
    return { status: payment.status, payment }
  }

  const getPaymentStatusBadge = (registrationId: string) => {
    const { status, payment } = getPaymentStatusForRegistration(registrationId)
    
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800" title={`Paid ₹${payment?.amount} on ${payment?.created_at ? formatDate(payment.created_at) : 'Unknown date'}`}>
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid ₹{payment?.amount}
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800" title={`Payment of ₹${payment?.amount} is pending`}>
            <Clock className="w-3 h-3 mr-1" />
            Pending ₹{payment?.amount}
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800" title={`Payment of ₹${payment?.amount} failed`}>
            <XCircle className="w-3 h-3 mr-1" />
            Failed ₹{payment?.amount}
          </Badge>
        )
      case 'unpaid':
        return (
          <Badge className="bg-gray-100 text-gray-800" title="No payment received">
            <AlertCircle className="w-3 h-3 mr-1" />
            Unpaid
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <Toaster />
      
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center relative">
          <div className="absolute top-0 right-0">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-10 h-10 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">MUNIQ Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">Database Testing & Registration Management</p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Database Status
                </CardTitle>
                {getDbStatusBadge()}
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={testConnection} className="w-full">
                Test Connection
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Registrations
                </CardTitle>
                <Badge variant="outline">{registrations.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchRegistrations} disabled={loading} className="w-full">
                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Refresh
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payments
                </CardTitle>
                <Badge variant="outline">{payments.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchPayments} disabled={loading} className="w-full">
                {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Refresh
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Refresh All Button */}
        <div className="text-center">
          <Button onClick={refreshAll} disabled={loading} size="lg" className="px-8">
            {loading ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <RefreshCw className="w-5 h-5 mr-2" />}
            Refresh All Data
          </Button>
        </div>

        {/* Registrations Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Registrations ({registrations.length})
                </CardTitle>
                <CardDescription>
                  All registered users for the workshop
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Paid: {registrations.filter(r => getPaymentStatusForRegistration(r.id).status === 'completed').length}
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending: {registrations.filter(r => getPaymentStatusForRegistration(r.id).status === 'pending').length}
                </Badge>
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="w-3 h-3 mr-1" />
                  Failed: {registrations.filter(r => getPaymentStatusForRegistration(r.id).status === 'failed').length}
                </Badge>
                <Badge className="bg-gray-100 text-gray-800">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Unpaid: {registrations.filter(r => getPaymentStatusForRegistration(r.id).status === 'unpaid').length}
                </Badge>
                <Badge className="bg-orange-100 text-orange-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 4h18a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1zm1 2v12h16V6H4zm2 2h12v2H6V8zm0 4h8v2H6v-2z"/>
                  </svg>
                  QR Payments: {payments.filter(p => p.payment_method === 'qr_code' && p.status === 'completed').length}
                </Badge>
                <Badge className="bg-blue-100 text-blue-800">
                  <CreditCard className="w-3 h-3 mr-1" />
                  Revenue: ₹{payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No registrations found. Try testing the registration form!
              </div>
            ) : (
              <div className="space-y-4">
                {registrations.map((registration) => (
                  <Card key={registration.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">
                              {registration.first_name} {registration.last_name}
                            </h4>
                            {getPaymentStatusBadge(registration.id)}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-2" />
                              {registration.email}
                            </div>
                            {registration.contact && (
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-2" />
                                {registration.contact}
                              </div>
                            )}
                            <div className="flex items-center">
                              <GraduationCap className="w-4 h-4 mr-2" />
                              {registration.standard}
                            </div>
                            {registration.institution && (
                              <div className="flex items-center">
                                <Building className="w-4 h-4 mr-2" />
                                {registration.institution}
                              </div>
                            )}
                            <div className="flex items-center">
                              <Trophy className="w-4 h-4 mr-2" />
                              MUN Experience: {registration.mun_experience}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 mb-2">
                            <div className="flex items-center justify-end">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(registration.created_at)}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            ID: {registration.id.slice(0, 8)}...
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payments ({payments.length})
            </CardTitle>
            <CardDescription>
              All payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No payments found. Complete a registration with payment to see data here!
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <Card key={payment.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">
                              {payment.registrations?.first_name} {payment.registrations?.last_name}
                            </h4>
                            {getStatusBadge(payment.status)}
                            {payment.payment_method && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  payment.payment_method === 'qr_code' 
                                    ? 'bg-orange-100 text-orange-800 border-orange-300' 
                                    : payment.payment_method === 'razorpay'
                                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                                    : 'bg-gray-100 text-gray-800 border-gray-300'
                                }`}
                              >
                                {payment.payment_method === 'qr_code' ? 'QR Payment' : 
                                 payment.payment_method === 'razorpay' ? 'Razorpay' : 'Manual'}
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div>Email: {payment.registrations?.email}</div>
                            <div>Amount: ₹{payment.amount} {payment.currency}</div>
                            <div>Payment ID: {payment.payment_id}</div>
                            {payment.order_id && <div>Order ID: {payment.order_id}</div>}
                            {payment.payment_method && (
                              <div>Method: {payment.payment_method === 'qr_code' ? 'QR Code Payment' : 
                                         payment.payment_method === 'razorpay' ? 'Razorpay Gateway' : 'Manual Entry'}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-500 mb-2">
                            <div className="flex items-center justify-end">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(payment.created_at)}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs mb-3">
                            ID: {payment.id.slice(0, 8)}...
                          </Badge>
                          
                          {/* Screenshot Display */}
                          {payment.payment_screenshot_url && (
                            <div className="mt-3">
                              <p className="text-xs text-gray-500 mb-2">Payment Screenshot:</p>
                              <div className="border rounded-lg p-2 bg-gray-50">
                                <img 
                                  src={payment.payment_screenshot_url} 
                                  alt="Payment Screenshot"
                                  className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => window.open(payment.payment_screenshot_url, '_blank')}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling!.classList.remove('hidden');
                                  }}
                                />
                                <div className="hidden text-center text-xs text-gray-500 py-8">
                                  <p>Failed to load screenshot</p>
                                  <a 
                                    href={payment.payment_screenshot_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    View Original
                                  </a>
                                </div>
                              </div>
                              <Button
                                onClick={() => window.open(payment.payment_screenshot_url, '_blank')}
                                variant="outline"
                                size="sm"
                                className="w-full mt-2 text-xs"
                              >
                                View Full Screenshot
                              </Button>
                            </div>
                          )}
                          
                          {payment.payment_method === 'qr_code' && !payment.payment_screenshot_url && (
                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-center">
                              <p className="text-xs text-yellow-700">QR Payment - No screenshot uploaded</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Test Database Connection</h4>
              <p className="text-sm text-gray-600">
                Click "Test Connection" to verify your Supabase database is properly connected.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">2. Test Registration</h4>
              <p className="text-sm text-gray-600">
                Go to the main page and fill out the registration form. The data should appear in the Registrations section above.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">3. Test QR Code Payment</h4>
              <p className="text-sm text-gray-600">
                Complete the registration flow and upload a payment screenshot using the QR code method. The payment will automatically be marked as completed.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">4. Test Razorpay Payment (when ready)</h4>
              <p className="text-sm text-gray-600">
                After setting up Razorpay production keys, test the online payment gateway. Both payment methods will appear in the Payments section.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
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
  Search,
  Filter,
  X,
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
  course_id?: string
  course_name?: string
  course_price?: number
  workshop_slot?: '2-4pm' | '4-6pm'
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
  course_id?: string
  course_name?: string
  course_details?: any
  status: string
  payment_screenshot_url?: string
  payment_method?: 'razorpay' | 'qr_code' | 'manual'
  created_at: string
  updated_at: string
  registrations?: {
    first_name: string
    last_name: string
    email: string
    course_name?: string
    course_id?: string
  }
}

export default function AdminPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [workshopSlotFilter, setWorkshopSlotFilter] = useState('all')
  const [munExperienceFilter, setMunExperienceFilter] = useState('all')
  const [standardFilter, setStandardFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  
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

  // Filter functions
  const filterRegistrations = (regs: Registration[]) => {
    return regs.filter(registration => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        `${registration.first_name} ${registration.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.contact?.includes(searchTerm) ||
        registration.institution?.toLowerCase().includes(searchTerm.toLowerCase())

      // Payment status filter
      const paymentStatus = getPaymentStatusForRegistration(registration.id).status
      const matchesPaymentStatus = paymentStatusFilter === 'all' || paymentStatus === paymentStatusFilter

      // Course filter
      const matchesCourse = courseFilter === 'all' || 
        registration.course_id === courseFilter ||
        (courseFilter === 'workshop' && (!registration.course_id || registration.course_id === 'workshop'))

      // Workshop slot filter (only for workshop)
      const matchesSlot = workshopSlotFilter === 'all' || registration.workshop_slot === workshopSlotFilter

      // MUN experience filter
      const matchesExperience = munExperienceFilter === 'all' || registration.mun_experience === munExperienceFilter

      // Standard filter
      const matchesStandard = standardFilter === 'all' || registration.standard === standardFilter

      // Date filter
      const registrationDate = new Date(registration.created_at)
      const now = new Date()
      let matchesDate = true
      
      if (dateFilter === 'today') {
        matchesDate = registrationDate.toDateString() === now.toDateString()
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchesDate = registrationDate >= weekAgo
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        matchesDate = registrationDate >= monthAgo
      }

      return matchesSearch && matchesPaymentStatus && matchesCourse && 
             matchesSlot && matchesExperience && matchesStandard && matchesDate
    })
  }

  const filterPayments = (pays: Payment[]) => {
    return pays.filter(payment => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        `${payment.registrations?.first_name} ${payment.registrations?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.registrations?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.payment_id.includes(searchTerm) ||
        payment.order_id?.includes(searchTerm)

      // Payment status filter
      const matchesPaymentStatus = paymentStatusFilter === 'all' || payment.status === paymentStatusFilter

      // Course filter
      const matchesCourse = courseFilter === 'all' || 
        payment.course_id === courseFilter ||
        (courseFilter === 'workshop' && (!payment.course_id || payment.course_id === 'workshop'))

      // Date filter
      const paymentDate = new Date(payment.created_at)
      const now = new Date()
      let matchesDate = true
      
      if (dateFilter === 'today') {
        matchesDate = paymentDate.toDateString() === now.toDateString()
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchesDate = paymentDate >= weekAgo
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        matchesDate = paymentDate >= monthAgo
      }

      return matchesSearch && matchesPaymentStatus && matchesCourse && matchesDate
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('')
    setPaymentStatusFilter('all')
    setCourseFilter('all')
    setWorkshopSlotFilter('all')
    setMunExperienceFilter('all')
    setStandardFilter('all')
    setDateFilter('all')
  }

  // Get the correct course information (prioritize payment data over registration data)
  const getCorrectCourseInfo = (registrationId: string, defaultCourse: any) => {
    // First, check if there's a payment for this registration with course info
    const payment = payments.find(p => p.registration_id === registrationId)
    if (payment?.course_name && payment?.course_id) {
      return {
        course_id: payment.course_id,
        course_name: payment.course_name,
        course_price: payment.amount || defaultCourse.price
      }
    }
    
    // Then check the registration itself
    const registration = registrations.find(r => r.id === registrationId)
    if (registration?.course_name && registration?.course_id) {
      return {
        course_id: registration.course_id,
        course_name: registration.course_name,
        course_price: registration.course_price || defaultCourse.price
      }
    }
    
    // Fall back to default course
    return {
      course_id: defaultCourse.id,
      course_name: defaultCourse.name,
      course_price: defaultCourse.price
    }
  }

  // Get filtered data
  const filteredRegistrations = filterRegistrations(registrations)
  const filteredPayments = filterPayments(payments)

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
                <Badge variant="outline">{filteredRegistrations.length}</Badge>
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
                <Badge variant="outline">{filteredPayments.length}</Badge>
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

        {/* Filter Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters & Search
              <Badge className="ml-3 bg-blue-100 text-blue-800">
                {filteredRegistrations.length} / {registrations.length} registrations
              </Badge>
              <Badge className="ml-2 bg-green-100 text-green-800">
                {filteredPayments.length} / {payments.length} payments
              </Badge>
            </CardTitle>
            <CardDescription>
              Filter and search through registrations and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="mb-4">
              <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                Search by name, email, contact, or institution
              </Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search registrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {/* Payment Status Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Payment Status</Label>
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Course Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Course</Label>
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="mun_course">MUN Course</SelectItem>
                    <SelectItem value="ip_course">IP Course</SelectItem>
                    <SelectItem value="strategic_call">Strategic Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Workshop Slot Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Workshop Slot</Label>
                <Select value={workshopSlotFilter} onValueChange={setWorkshopSlotFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Slots</SelectItem>
                    <SelectItem value="2-4pm">2-4 PM</SelectItem>
                    <SelectItem value="4-6pm">4-6 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* MUN Experience Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Experience</Label>
                <Select value={munExperienceFilter} onValueChange={setMunExperienceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Standard Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Standard</Label>
                <Select value={standardFilter} onValueChange={setStandardFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Standards</SelectItem>
                    <SelectItem value="9th">9th</SelectItem>
                    <SelectItem value="10th">10th</SelectItem>
                    <SelectItem value="11th">11th</SelectItem>
                    <SelectItem value="12th">12th</SelectItem>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="postgraduate">Postgraduate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Filter */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Date Range</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registrations Section - Grouped by Courses */}
        {[
          { id: 'mun_course', name: 'MUN Mastery Course', color: 'blue', price: 999 },
          { id: 'ip_course', name: 'IP Mastery Course', color: 'green', price: 699 },
          { id: 'strategic_call', name: 'Strategic 1-1 Call', color: 'purple', price: 349 },
          { id: 'workshop', name: 'Beginner Workshop', color: 'orange', price: 499 }
        ].map(course => {
          const courseRegistrations = filteredRegistrations.filter(r => 
            r.course_id === course.id || 
            (course.id === 'workshop' && (!r.course_id || r.course_id === 'workshop'))
          )
          
          const coursePaidCount = courseRegistrations.filter(r => getPaymentStatusForRegistration(r.id).status === 'completed').length
          const coursePendingCount = courseRegistrations.filter(r => getPaymentStatusForRegistration(r.id).status === 'pending').length
          const courseFailedCount = courseRegistrations.filter(r => getPaymentStatusForRegistration(r.id).status === 'failed').length
          const courseUnpaidCount = courseRegistrations.filter(r => getPaymentStatusForRegistration(r.id).status === 'unpaid').length
          const courseRevenue = courseRegistrations.reduce((sum, r) => {
            const payment = payments.find(p => p.registration_id === r.id && p.status === 'completed')
            return sum + (payment ? payment.amount : 0)
          }, 0)
          
          return (
            <Card key={course.id} className={`border-${course.color}-200`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      {course.name} ({courseRegistrations.length})
                      <Badge 
                        className={`ml-3 bg-${course.color}-100 text-${course.color}-800`}
                      >
                        ₹{course.price}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Course registrations and payment status
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Paid: {coursePaidCount}
                    </Badge>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending: {coursePendingCount}
                    </Badge>
                    <Badge className="bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3 mr-1" />
                      Failed: {courseFailedCount}
                    </Badge>
                    <Badge className="bg-gray-100 text-gray-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Unpaid: {courseUnpaidCount}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800">
                      <CreditCard className="w-3 h-3 mr-1" />
                      Revenue: ₹{courseRevenue}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {courseRegistrations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="mb-2">
                      📚 {(() => {
                        const allCourseRegs = registrations.filter(r => 
                          r.course_id === course.id || 
                          (course.id === 'workshop' && (!r.course_id || r.course_id === 'workshop'))
                        );
                        return allCourseRegs.length === 0 
                          ? `No registrations found for ${course.name} yet.`
                          : `No registrations match the current filters for ${course.name}.`;
                      })()}
                    </div>
                    <div className="text-sm">
                      {(() => {
                        const allCourseRegs = registrations.filter(r => 
                          r.course_id === course.id || 
                          (course.id === 'workshop' && (!r.course_id || r.course_id === 'workshop'))
                        );
                        return allCourseRegs.length === 0 
                          ? "Try registering for this course to see it appear here!"
                          : "Try adjusting your search criteria or clear filters to see more results.";
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courseRegistrations.map((registration) => (
                      <Card key={registration.id} className={`border-l-4 border-l-${course.color}-500`}>
                        <CardContent className="p-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg">
                                  {registration.first_name} {registration.last_name}
                                </h4>
                                {getPaymentStatusBadge(registration.id)}
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs bg-${course.color}-50 text-${course.color}-700 border-${course.color}-300`}
                                >
                                  {getCorrectCourseInfo(registration.id, course).course_name}
                                </Badge>
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
                                {(() => {
                                  const courseInfo = getCorrectCourseInfo(registration.id, course)
                                  return courseInfo.course_price && (
                                    <div className="flex items-center">
                                      <CreditCard className="w-4 h-4 mr-2" />
                                      Course Price: ₹{courseInfo.course_price}
                                    </div>
                                  )
                                })()}
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
          )
        })}

        {/* Overall Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Overall Statistics ({registrations.length} Total)
            </CardTitle>
            <CardDescription>
              Combined statistics for all courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Course Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">MUN Mastery Course:</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {registrations.filter(r => r.course_id === 'mun_course').length} registrations
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">IP Mastery Course:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {registrations.filter(r => r.course_id === 'ip_course').length} registrations
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-700">Strategic 1-1 Call:</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      {registrations.filter(r => r.course_id === 'strategic_call').length} registrations
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-orange-700">Beginner Workshop:</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      {registrations.filter(r => r.course_id === 'workshop' || !r.course_id).length} registrations
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Payment & Revenue</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700">Razorpay Payments:</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {payments.filter(p => p.payment_method === 'razorpay' && p.status === 'completed').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-orange-700">QR Payments:</span>
                    <Badge className="bg-orange-100 text-orange-800">
                      {payments.filter(p => p.payment_method === 'qr_code' && p.status === 'completed').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-700">Manual Payments:</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      {payments.filter(p => p.payment_method === 'manual' && p.status === 'completed').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-700 font-bold">Total Revenue:</span>
                    <Badge className="bg-green-100 text-green-800 font-bold">
                      ₹{payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payments ({filteredPayments.length})
            </CardTitle>
            <CardDescription>
              All payment transactions with course details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {payments.length === 0 ? 
                  "No payments found. Complete a registration with payment to see data here!" :
                  "No payments match the current filters. Try adjusting your search criteria."
                }
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <Card key={payment.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">
                              {payment.registrations?.first_name} {payment.registrations?.last_name}
                            </h4>
                            {getStatusBadge(payment.status)}
                            {payment.course_name && (
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-indigo-100 text-indigo-800 border-indigo-300"
                              >
                                {payment.course_name}
                              </Badge>
                            )}
                            {payment.payment_method && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  payment.payment_method === 'qr_code' 
                                    ? 'bg-orange-100 text-orange-800 border-orange-300' 
                                    : payment.payment_method === 'razorpay'
                                    ? 'bg-blue-100 text-blue-800 border-blue-300'
                                    : payment.payment_method === 'manual'
                                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                                    : 'bg-gray-100 text-gray-800 border-gray-300'
                                }`}
                              >
                                {payment.payment_method === 'qr_code' ? 'QR Payment' : 
                                 payment.payment_method === 'razorpay' ? 'Razorpay' : 
                                 payment.payment_method === 'manual' ? 'Manual' : 'Other'}
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div>Email: {payment.registrations?.email}</div>
                            <div>Amount: ₹{payment.amount} {payment.currency}</div>
                            <div>Payment ID: {payment.payment_id}</div>
                            {payment.order_id && <div>Order ID: {payment.order_id}</div>}
                            {payment.course_name && <div>Course: {payment.course_name}</div>}
                            {payment.course_id && <div>Course ID: {payment.course_id}</div>}
                            {payment.payment_method && (
                              <div>Method: {payment.payment_method === 'qr_code' ? 'QR Code Payment' : 
                                         payment.payment_method === 'razorpay' ? 'Razorpay Gateway' : 
                                         payment.payment_method === 'manual' ? 'Manual Entry (Admin)' : 'Other'}</div>
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
                          
                          {/* Course Details */}
                          {payment.course_details && (
                            <div className="mt-3 p-2 bg-indigo-50 border border-indigo-200 rounded text-center">
                              <p className="text-xs text-indigo-700 font-semibold">Course Details:</p>
                              <p className="text-xs text-indigo-600">{JSON.stringify(payment.course_details, null, 2)}</p>
                            </div>
                          )}
                          
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
                          
                          {payment.payment_method === 'manual' && (
                            <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded text-center">
                              <p className="text-xs text-purple-700">Manual Payment - No screenshot required</p>
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
              <h4 className="font-semibold mb-2">2. Test Course Selection & Registration</h4>
              <p className="text-sm text-gray-600">
                Go to the main page, select different courses (MUN Mastery, IP Course, Strategic 1-1 Call, or Workshop), and fill out the registration form. Each course selection should appear with correct pricing in the admin panel.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">3. Test Razorpay Payment (Production)</h4>
              <p className="text-sm text-gray-600">
                Complete the registration flow with live Razorpay credentials. Payment should process securely and appear in the Payments section with course details.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">4. Test Different Course Pricing</h4>
              <p className="text-sm text-gray-600">
                Test each course to verify correct pricing: MUN Course (₹999), IP Course (₹699), Strategic Call (₹349), Workshop (₹499). Revenue should be tracked per course.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">5. Test Strategic 1-1 Call Notifications</h4>
              <p className="text-sm text-gray-600">
                Select Strategic 1-1 Call to verify the 2-day contact notifications appear correctly during selection, payment, and confirmation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
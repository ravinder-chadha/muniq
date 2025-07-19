"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  CheckCircle,
  Users,
  Award,
  Globe,
  BookOpen,
  MessageSquare,
  Target,
  Star,
  ArrowRight,
  Sparkles,
  Trophy,
  Clock,
  Calendar,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Download,
  AlertCircle,
} from "lucide-react"

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function MuniqWebsite() {
  const [currentSection, setCurrentSection] = useState("home")
  const [isLoading, setIsLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dob: "",
    standard: "",
    institution: "",
    munExperience: "",
    email: "",
    contact: "",
    agreedToTerms: false,
  })


  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const scrollToSection = (sectionId: string) => {
    setCurrentSection(sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      // Scroll with some offset from the top to ensure good visibility
      const elementPosition = element.offsetTop - 80
      window.scrollTo({
        top: elementPosition,
        behavior: "smooth"
      })
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Remove field from errors when user starts typing
    if (formErrors.includes(field)) {
      setFormErrors((prev) => prev.filter((error) => error !== field))
    }
  }

  const validateForm = () => {
    const requiredFields = ["firstName", "lastName", "standard", "munExperience", "email"]
    const errors = requiredFields.filter((field) => !formData[field as keyof typeof formData])

    // Check if terms are agreed to
    if (!formData.agreedToTerms) {
      errors.push("agreedToTerms")
    }

    setFormErrors(errors)

    if (errors.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: !formData.agreedToTerms 
          ? "Please agree to the Terms & Conditions to proceed"
          : "Please fill in all mandatory fields marked with *",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const saveFormData = async (data: typeof formData) => {
    try {
      // Save to localStorage as backup
      localStorage.setItem(
        "muniq_registration",
        JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
        }),
      )

      // Save to database
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to save registration data")
      }

      const responseData = await response.json()
      console.log("Registration data saved successfully:", responseData.data.id)
      
      // Store registration ID for payment
      localStorage.setItem("muniq_registration_id", responseData.data.id)
      
      return responseData.data
    } catch (error) {
      console.error("Error saving registration data:", error)
      
      // Show error to user
      toast({
        title: "Registration Error",
        description: error instanceof Error ? error.message : "Failed to save registration data",
        variant: "destructive",
      })
      
      throw error // Re-throw to prevent proceeding to payment
    }
  }

  const handleRegistration = async () => {
    if (!validateForm()) {
      return
    }

    try {
      // Save form data and get registration ID
      const registrationData = await saveFormData(formData)
      
      // Always proceed to payment section after registration
      console.log("Razorpay Key ID:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)
      setCurrentSection("payment")
      
      // Add a small delay to ensure the payment section is rendered before scrolling
      setTimeout(() => {
        scrollToSection("payment")
      }, 100)
    } catch (error) {
      // Error already handled in saveFormData
      console.error("Registration failed:", error)
    }
  }

  const handlePayment = async () => {
    setIsLoading(true)

    try {
      // Get registration ID from localStorage
      const registrationId = localStorage.getItem("muniq_registration_id")
      
      if (!registrationId) {
        throw new Error("Registration ID not found")
      }

      // Step 1: Create order on server
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 11, // ₹11
          currency: "INR",
          registrationId,
          customerDetails: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.contact,
          }
        }),
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        throw new Error(errorData.message || "Failed to create payment order")
      }

      const orderData = await orderResponse.json()

      // Step 2: Initialize Razorpay with order
      const options = {
        key: orderData.data.keyId,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        order_id: orderData.data.orderId,
        name: "MUNIQ by AJ",
        description: "Beginner MUN Workshop Registration",
        image: "/logo_c_bg.png",
        handler: async (response: any) => {
          try {
            // Step 3: Verify payment on server
            const verificationResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                registrationId,
              }),
            })

            if (!verificationResponse.ok) {
              const errorData = await verificationResponse.json()
              throw new Error(errorData.message || "Payment verification failed")
            }

            const verificationData = await verificationResponse.json()

            // Save payment info to localStorage as backup
            const completePaymentData = {
              ...formData,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              amount: 11,
              timestamp: new Date().toISOString(),
              verified: true,
            }

            localStorage.setItem("muniq_payment", JSON.stringify(completePaymentData))

            setCurrentSection("confirmation")
            scrollToSection("confirmation")

            toast({
              title: "Payment Successful!",
              description: "Thank you for registering for MUNIQ. Your registration has been confirmed.",
            })
          } catch (error) {
            console.error("Error verifying payment:", error)
            
            toast({
              title: "Payment Verification Failed",
              description: error instanceof Error ? error.message : "Please contact support with your payment details.",
              variant: "destructive",
            })
          } finally {
            setIsLoading(false)
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.contact,
        },
        notes: {
          standard: formData.standard,
          institution: formData.institution,
          munExperience: formData.munExperience,
        },
        theme: {
          color: "#1e40af",
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false)
          },
        },
      }

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        throw new Error("Razorpay not loaded")
      }

    } catch (error) {
      console.error("Error initiating payment:", error)
      setIsLoading(false)
      
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment. Please try again.",
        variant: "destructive",
      })
    }
  }

const handleScreenshotUpload = async () => {
  if (!selectedFile) {
    toast({
      title: "No File Selected",
      description: "Please select a payment screenshot to upload",
      variant: "destructive",
    })
    return
  }

  const registrationId = localStorage.getItem("muniq_registration_id")
  if (!registrationId) {
    toast({
      title: "Registration Error",
      description: "Registration ID not found. Please register again.",
      variant: "destructive",
    })
    return
  }

  setIsUploading(true)
  setUploadProgress(0)

  try {
    const formData = new FormData()
    formData.append('screenshot', selectedFile)
    formData.append('registrationId', registrationId)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 10
      })
    }, 100)

    const response = await fetch('/api/payment/upload-screenshot', {
      method: 'POST',
      body: formData
    })

    clearInterval(progressInterval)
    setUploadProgress(100)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Upload failed')
    }

    const responseData = await response.json()

    // Save payment info to localStorage as backup
    const completePaymentData = {
      ...formData,
      paymentId: responseData.data.paymentId,
      amount: responseData.data.amount,
      timestamp: new Date().toISOString(),
      verified: true,
      paymentMethod: 'qr_code',
      screenshotUrl: responseData.data.screenshotUrl
    }

    localStorage.setItem("muniq_payment", JSON.stringify(completePaymentData))

    setCurrentSection("confirmation")
    scrollToSection("confirmation")

    toast({
      title: "Payment Confirmed!",
      description: "Your payment screenshot has been uploaded successfully. Registration confirmed!",
    })

  } catch (error) {
    console.error("Error uploading screenshot:", error)
    toast({
      title: "Upload Failed",
      description: error instanceof Error ? error.message : "Failed to upload screenshot. Please try again.",
      variant: "destructive",
    })
  } finally {
    setIsUploading(false)
    setUploadProgress(0)
  }
}

const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid image file (PNG, JPG, JPEG)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
  }
}

const handleBrochureDownload = () => {
  const pdfPath = "/Muniq_pamphlet.pdf"; // Updated to match the actual file name

  const a = document.createElement("a");
  a.href = pdfPath;
  a.download = "Muniq_pamphlet.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  toast({
    title: "Brochure Downloaded!",
    description: "The workshop brochure PDF has been downloaded to your device.",
  });
};

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Toaster />

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-blue-100 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection("home")}>
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="MUNIQ Logo"
                  width={45}
                  height={45}
                  className="hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
                MUNIQ
              </span>
            </div>
            <div className="hidden md:flex space-x-8">
              {["Home", "About", "Workshop", "Founders"].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className="text-blue-700 hover:text-blue-900 transition-all duration-300 font-medium relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </button>
              ))}
            </div>
            <Button
              onClick={() => scrollToSection("registration")}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Register Now
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="pt-20 pb-20 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12 animate-fade-in-up">
              <div className="relative inline-block mb-8">
                <Image
                  src="/logo_c_bg.png"
                  alt="MUNIQ Logo"
                  width={140}
                  height={140}
                  className="mx-auto mb-6 hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
                />
                <div className="absolute -inset-4 bg-white/10 rounded-full blur-lg"></div>
              </div>

              <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">MUNIQ</span>
                <span className="block text-4xl md:text-5xl font-light text-blue-200 mt-2 leading-tight">by AJ</span>
              </h1>

              <div className="relative">
                <p className="text-3xl md:text-4xl text-blue-100 mb-12 font-light tracking-wide leading-tight">
                  Where diplomats are built.
                </p>
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 to-transparent rounded-lg blur-sm"></div>
              </div>
            </div>

            <div className="space-y-8 mb-16 animate-fade-in-up animation-delay-500">
              <div className="relative group">
                <blockquote className="text-3xl md:text-5xl font-bold text-white italic transform group-hover:scale-105 transition-transform duration-300 leading-tight">
                  "Speak so the world listens."
                </blockquote>
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              <div className="relative group">
                <blockquote className="text-3xl md:text-5xl font-bold text-white italic transform group-hover:scale-105 transition-transform duration-300 leading-tight">
                  "Lead so the world follows."
                </blockquote>
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-400/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up animation-delay-1000">
              <Button
                onClick={() => scrollToSection("registration")}
                size="lg"
                className="bg-white text-blue-900 hover:bg-blue-50 text-xl px-10 py-6 rounded-full font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 group"
              >
                <Trophy className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                Join the Diplomatic Revolution
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>

              <Button
                onClick={() => scrollToSection("workshop")}
                size="lg"
                className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-blue-900 text-lg px-8 py-6 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
              >
                View Workshop Details
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome Section */}
      <section id="about" className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="mb-8 animate-fade-in-up">
              <Badge className="bg-blue-100 text-blue-800 px-6 py-2 text-lg font-semibold mb-6">
                Welcome to Excellence
              </Badge>
              <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent mb-8 leading-tight">
                WELCOME TO MUNIQ
              </h2>
            </div>

            <p className="text-xl text-gray-700 mb-16 leading-relaxed max-w-4xl mx-auto animate-fade-in-up animation-delay-300">
              Welcome to MUNIQ, where future diplomats are shaped through immersive Model United Nations experiences. We
              believe in empowering young minds with the skills of diplomacy, negotiation, and global leadership that
              will define tomorrow's world.
            </p>

            <div className="relative animate-fade-in-up animation-delay-500">
              <div className="text-3xl font-bold text-blue-800 mb-12 leading-tight">Your Diplomatic Journey</div>
              <div className="flex flex-col md:flex-row justify-center items-center space-y-8 md:space-y-0 md:space-x-12">
                {[
                  { step: "Learn", icon: BookOpen, delay: "0s" },
                  { step: "Practice", icon: Users, delay: "0.5s" },
                  { step: "Excel", icon: Trophy, delay: "1s" },
                  { step: "Lead", icon: Star, delay: "1.5s" },
                ].map((item, index) => (
                  <div key={item.step} className="flex flex-col items-center group">
                    <div
                      className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110"
                      style={{ animationDelay: item.delay }}
                    >
                      <item.icon className="w-10 h-10 text-white" />
                    </div>
                    <span className="text-xl font-semibold text-blue-900 group-hover:text-blue-600 transition-colors duration-300">
                      {item.step}
                    </span>
                    {index < 3 && (
                      <ArrowRight className="w-8 h-8 text-blue-400 mt-4 md:mt-0 md:ml-8 md:absolute md:translate-x-24 hidden md:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent mb-6 leading-tight">
                What We Do
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Comprehensive MUN training that transforms students into confident global leaders
              </p>
            </div>

            <div className="grid md:grid-cols-5 gap-8">
              {[
                { icon: BookOpen, title: "MUN Training", desc: "Comprehensive Model UN education" },
                { icon: MessageSquare, title: "Public Speaking", desc: "Confident communication skills" },
                { icon: Users, title: "Leadership", desc: "Essential leadership development" },
                { icon: Globe, title: "Global Awareness", desc: "International relations insight" },
                { icon: Award, title: "Certification", desc: "Recognized achievement certificates" },
              ].map((item, index) => (
                <Card
                  key={item.title}
                  className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300">
                      <item.icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="font-bold text-blue-900 text-lg mb-3 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why MUNIQ Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent mb-4 leading-tight">
                Why MUNIQ?
              </h2>
              <p className="text-2xl text-blue-700 font-semibold mb-8 leading-tight">Sharpening your future</p>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto rounded-full"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  title: "Expert Guidance",
                  desc: "Learn from experienced MUN delegates and diplomats who understand the nuances of international relations and can guide you to excellence.",
                  color: "from-blue-500 to-blue-600",
                },
                {
                  icon: Star,
                  title: "Practical Learning",
                  desc: "Hands-on workshops that simulate real UN sessions, giving you authentic diplomatic experience that you can't get anywhere else.",
                  color: "from-indigo-500 to-indigo-600",
                },
                {
                  icon: CheckCircle,
                  title: "Proven Results",
                  desc: "Our participants consistently excel in MUN conferences and develop strong leadership capabilities that serve them throughout their careers.",
                  color: "from-blue-600 to-indigo-600",
                },
              ].map((item, index) => (
                <Card
                  key={item.title}
                  className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <CardHeader className="text-center pb-4">
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                    >
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-blue-900 text-xl group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed text-center">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Workshop Section */}
      <section id="workshop" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <Badge className="bg-red-100 text-red-800 px-6 py-2 text-lg font-semibold mb-6">
                🔥 Limited Seats Available
              </Badge>
              <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent mb-6 leading-tight">
                Upcoming Workshop
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">Transform your diplomatic skills in just 2 hours</p>
            </div>

            <Card className="border-0 shadow-2xl overflow-hidden animate-fade-in-up animation-delay-300">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <CardTitle className="text-3xl mb-3 font-bold leading-tight">Beginner Workshop</CardTitle>
                    <CardDescription className="text-blue-100 text-lg leading-relaxed">
                      Perfect for MUN newcomers and enthusiasts
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-3 mt-4 md:mt-0">
                    <Badge className="bg-white text-blue-600 font-semibold px-4 py-2">
                      <Award className="w-4 h-4 mr-2" />
                      Certificate Provided
                    </Badge>
                    <Badge className="bg-red-500 text-white font-semibold px-4 py-2 animate-pulse">
                      🔥 Few Slots Left
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h4 className="text-2xl font-bold text-blue-900 mb-6 leading-tight">Workshop Details</h4>
                    {[
                      { icon: Clock, label: "Duration", value: "2 hours" },
                      { icon: Globe, label: "Mode", value: "Online" },
                      { icon: Calendar, label: "Date", value: "20th July" },
                      { icon: MapPin, label: "Time", value: "To be announced" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-300"
                      >
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <item.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <span className="font-semibold text-blue-900">{item.label}:</span>
                          <span className="ml-2 text-gray-700">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="text-2xl font-bold text-blue-900 mb-6 leading-tight">Topics Covered</h4>
                    <div className="space-y-4">
                      {[
                        "How to prepare for MUNs",
                        "Research Hacks",
                        "Making Strong Points",
                        "Winning Debates, Not Fights",
                        "Secret Tips to Win",
                      ].map((topic, index) => (
                        <div
                          key={topic}
                          className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-all duration-300"
                        >
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <span className="text-gray-700 font-medium">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator className="my-8" />

                <div className="text-center">
                  <div className="mb-8">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="text-2xl font-bold text-gray-400 line-through">₹499/-</div>
                      <div className="text-4xl font-bold text-green-600">₹11/-</div>
                      <Badge className="bg-green-100 text-green-800 font-bold">98% OFF!</Badge>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      Includes certificate, materials, and lifetime access to resources
                    </p>
                    <p className="text-red-600 font-semibold mt-2">⚡ Limited Time Offer!</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => scrollToSection("registration")}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Register Now
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>

                    <Button
                      onClick={handleBrochureDownload}
                      variant="outline"
                      size="lg"
                      className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white text-lg px-8 py-4 transition-all duration-300 bg-transparent"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download Brochure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Founders Section */}
      <section id="founders" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent mb-6 leading-tight">
                Meet Our Founders
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Visionary leaders shaping the next generation of diplomats
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group animate-fade-in-up">
                <CardHeader className="text-center pb-6">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full mx-auto overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                      <Image
                        src="/ra-photo.png"
                        alt="Rakshit Ahuja"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
                  </div>
                  <CardTitle className="text-blue-900 text-2xl mb-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                    Rakshit Ahuja
                  </CardTitle>
                  <CardDescription className="text-blue-700 font-semibold text-lg leading-tight">
                    Co-Founder & Lead Trainer
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center px-8 pb-8">
                  <p className="text-gray-700 leading-relaxed">
                    An accomplished undergraduate with extensive MUN experience as both a delegate and Executive Board member. A successful entrepreneur and passionate educator, he brings his leadership and teaching expertise to the forefront as the lead trainer, guiding students to excel in diplomacy, public speaking, and strategic committee engagement.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group animate-fade-in-up animation-delay-300">
                <CardHeader className="text-center pb-6">
                  <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full mx-auto overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110">
                      <Image
                        src="/oj-photo.jpeg"
                        alt="Om Jhanji"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -inset-4 bg-gradient-to-r from-indigo-400/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
                  </div>
                  <CardTitle className="text-blue-900 text-2xl mb-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                    Om Jhanji
                  </CardTitle>
                  <CardDescription className="text-blue-700 font-semibold text-lg leading-tight">
                    Co-Founder & Strategy Director
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center px-8 pb-8">
                  <p className="text-gray-700 leading-relaxed">
                    An experienced MUN enthusiast and student at the University of Melbourne, bringing a strong
                    foundation in research, diplomacy, and strategic thinking. With years of involvement in both
                    participating and organizing MUNs, he offers students a deep understanding of committee dynamics,
                    public speaking, and global affairs through engaging and practical workshop experiences.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Section */}
      <section id="registration" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <Badge className="bg-green-100 text-green-800 px-6 py-2 text-lg font-semibold mb-6">
                🚀 Secure Your Spot
              </Badge>
              <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent mb-6 leading-tight">
                Register for Workshop
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">Join the diplomatic revolution today</p>
              
              {/* Slot Information */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {/* Closed Slot */}
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-bold text-red-800">Slot 1: 2:00 PM - 4:00 PM</h3>
                  </div>
                  <p className="text-red-600 font-semibold">CLOSED</p>
                  <p className="text-red-600 text-sm">Registration Full</p>
                </div>
                
                {/* Available Slot */}
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-bold text-green-800">Slot 2: 4:00 PM - 6:00 PM</h3>
                  </div>
                  <p className="text-green-600 font-semibold">AVAILABLE</p>
                  <p className="text-green-600 text-sm">Register Now!</p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <h4 className="font-semibold text-blue-800">New Registrations</h4>
                </div>
                <p className="text-blue-700 text-sm">
                  All new registrations will be automatically assigned to <strong>Slot 2 (4:00 PM - 6:00 PM)</strong>
                </p>
              </div>
            </div>

            <Card className="border-0 shadow-2xl animate-fade-in-up animation-delay-300">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
                <CardTitle className="text-2xl font-bold leading-tight">Registration Form</CardTitle>
                <CardDescription className="text-blue-100 text-lg leading-relaxed">
                  All fields marked with * are mandatory
                </CardDescription>
              </CardHeader>

              <CardContent className="p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-blue-900 font-semibold">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className={`border-2 transition-colors duration-300 ${
                        formErrors.includes("firstName")
                          ? "border-red-500 focus:border-red-500"
                          : "border-blue-200 focus:border-blue-500"
                      }`}
                      required
                    />
                    {formErrors.includes("firstName") && (
                      <div className="flex items-center text-red-500 text-sm mt-1">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        First name is required
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-blue-900 font-semibold">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className={`border-2 transition-colors duration-300 ${
                        formErrors.includes("lastName")
                          ? "border-red-500 focus:border-red-500"
                          : "border-blue-200 focus:border-blue-500"
                      }`}
                      required
                    />
                    {formErrors.includes("lastName") && (
                      <div className="flex items-center text-red-500 text-sm mt-1">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Last name is required
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-blue-900 font-semibold">
                    Date of Birth
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleInputChange("dob", e.target.value)}
                    className="border-2 border-blue-200 focus:border-blue-500 transition-colors duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="standard" className="text-blue-900 font-semibold">
                    Standard (Education Level) *
                  </Label>
                  <Select value={formData.standard} onValueChange={(value) => handleInputChange("standard", value)}>
                    <SelectTrigger
                      className={`border-2 transition-colors duration-300 ${
                        formErrors.includes("standard")
                          ? "border-red-500 focus:border-red-500"
                          : "border-blue-200 focus:border-blue-500"
                      }`}
                    >
                      <SelectValue placeholder="Select your standard" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9th">9th Grade</SelectItem>
                      <SelectItem value="10th">10th Grade</SelectItem>
                      <SelectItem value="11th">11th Grade</SelectItem>
                      <SelectItem value="12th">12th Grade</SelectItem>
                      <SelectItem value="undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="postgraduate">Postgraduate</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.includes("standard") && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Please select your education level
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="institution" className="text-blue-900 font-semibold">
                    Institution
                  </Label>
                  <Input
                    id="institution"
                    value={formData.institution}
                    onChange={(e) => handleInputChange("institution", e.target.value)}
                    className="border-2 border-blue-200 focus:border-blue-500 transition-colors duration-300"
                    placeholder="Your school/college name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="munExperience" className="text-blue-900 font-semibold">
                    MUN Experience *
                  </Label>
                  <Select
                    value={formData.munExperience}
                    onValueChange={(value) => handleInputChange("munExperience", value)}
                  >
                    <SelectTrigger
                      className={`border-2 transition-colors duration-300 ${
                        formErrors.includes("munExperience")
                          ? "border-red-500 focus:border-red-500"
                          : "border-blue-200 focus:border-blue-500"
                      }`}
                    >
                      <SelectValue placeholder="Select your MUN experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (0 conferences)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (1-3 conferences)</SelectItem>
                      <SelectItem value="advanced">Advanced (4+ conferences)</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.includes("munExperience") && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Please select your MUN experience level
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-blue-900 font-semibold">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`border-2 transition-colors duration-300 ${
                      formErrors.includes("email")
                        ? "border-red-500 focus:border-red-500"
                        : "border-blue-200 focus:border-blue-500"
                    }`}
                    required
                  />
                  {formErrors.includes("email") && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Valid email address is required
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact" className="text-blue-900 font-semibold">
                    Contact Number
                  </Label>
                  <Input
                    id="contact"
                    type="tel"
                    value={formData.contact}
                    onChange={(e) => handleInputChange("contact", e.target.value)}
                    className="border-2 border-blue-200 focus:border-blue-500 transition-colors duration-300"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <input
                      id="agreedToTerms"
                      type="checkbox"
                      checked={formData.agreedToTerms}
                      onChange={(e) => handleInputChange("agreedToTerms", e.target.checked)}
                      className={`mt-1 h-4 w-4 rounded border-2 transition-colors duration-300 ${
                        formErrors.includes("agreedToTerms")
                          ? "border-red-500 focus:border-red-500"
                          : "border-blue-300 focus:border-blue-500"
                      }`}
                      required
                    />
                    <Label htmlFor="agreedToTerms" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-blue-600 hover:text-blue-800 underline font-semibold"
                        target="_blank"
                      >
                        Terms & Conditions
                      </Link>
                      ,{" "}
                      <Link
                        href="/privacy"
                        className="text-blue-600 hover:text-blue-800 underline font-semibold"
                        target="_blank"
                      >
                        Privacy Policy
                      </Link>
                      , and{" "}
                      <Link
                        href="/refund"
                        className="text-blue-600 hover:text-blue-800 underline font-semibold"
                        target="_blank"
                      >
                        Cancellation & Refund Policy
                      </Link>
                      . *
                    </Label>
                  </div>
                  {formErrors.includes("agreedToTerms") && (
                    <div className="flex items-center text-red-500 text-sm mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      You must agree to the Terms & Conditions to proceed
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleRegistration}
                  disabled={!formData.agreedToTerms}
                  className={`w-full text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                    !formData.agreedToTerms
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  }`}
                  size="lg"
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Proceed to Payment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Payment Section */}
      {currentSection === "payment" && (
        <section id="payment" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto space-y-6">
              
              {/* Razorpay Coming Soon Notice */}
              <Card className="border-2 border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-yellow-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-yellow-800">Razorpay Payment Gateway Coming Soon!</p>
                      <p className="text-xs text-yellow-700">Online payment will be available within 1-2 days.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* QR Code Payment Option */}
              <Card className="border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white text-center p-8">
                  <CardTitle className="text-2xl font-bold leading-tight">Early Registration Payment</CardTitle>
                  <CardDescription className="text-green-100 text-lg leading-relaxed">
                    Pay via QR Code & WhatsApp
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-8 space-y-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="text-2xl font-bold text-gray-400 line-through">₹499/-</div>
                      <div className="text-4xl font-bold text-green-600">₹11/-</div>
                    </div>
                    <p className="text-gray-600 mb-6 leading-relaxed">Beginner Workshop</p>
                  </div>

                  <div className="space-y-3 text-left bg-green-50 p-6 rounded-lg">
                    <p className="flex justify-between">
                      <strong>Name:</strong>
                      <span>
                        {formData.firstName} {formData.lastName}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <strong>Email:</strong>
                      <span>{formData.email}</span>
                    </p>
                    <p className="flex justify-between">
                      <strong>Standard:</strong>
                      <span>{formData.standard}</span>
                    </p>
                  </div>

                  {/* QR Code Section */}
                  <div className="bg-white p-6 rounded-lg border-2 border-green-200 text-center">
                    <h3 className="font-bold text-lg mb-4 text-green-800">Scan QR Code to Pay ₹11</h3>
                    <div className="flex justify-center mb-4">
                      <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <img 
                          src="/payment-qr2.jpeg" 
                          alt="Payment QR Code" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling!.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden text-gray-500 text-center p-4">
                          <p className="text-sm font-medium">QR Code</p>
                          <p className="text-xs">Image will be added soon</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-center mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Scan this QR code with any UPI app to pay ₹11
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 inline-block">
                        <p className="text-xs text-blue-700 font-medium">UPI ID:</p>
                        <p className="text-sm font-mono font-bold text-blue-900 select-all">8699397771@ptsbi</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Or copy this UPI ID to pay manually
                      </p>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 p-6 rounded-lg space-y-4">
                    <h3 className="font-bold text-lg text-blue-800">Payment Instructions:</h3>
                    <ol className="space-y-2 text-sm text-blue-700">
                      <li className="flex items-start gap-2">
                        <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                        <span>Scan the QR code above and pay <strong>₹11</strong> using any UPI app</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                        <span>Take a screenshot of the successful payment</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                        <span>Upload the payment screenshot below to confirm your registration</span>
                      </li>
                    </ol>
                  </div>

                  {/* File Upload Section */}
                  <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200 space-y-4">
                    <h3 className="font-bold text-lg text-orange-800">Upload Payment Screenshot</h3>
                    
                    <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="screenshot-upload"
                        disabled={isUploading}
                      />
                      <label 
                        htmlFor="screenshot-upload" 
                        className={`cursor-pointer flex flex-col items-center space-y-3 ${isUploading ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-orange-800 font-semibold">
                            {selectedFile ? selectedFile.name : "Click to upload payment screenshot"}
                          </p>
                          <p className="text-orange-600 text-sm">
                            PNG, JPG, JPEG up to 10MB
                          </p>
                        </div>
                      </label>
                    </div>

                    {selectedFile && (
                      <div className="flex items-center justify-between bg-white p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="text-red-500 hover:text-red-700"
                          disabled={isUploading}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {isUploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-orange-700">
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-orange-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <Button
                    onClick={handleScreenshotUpload}
                    disabled={!selectedFile || isUploading}
                    className={`w-full text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                      !selectedFile || isUploading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    }`}
                    size="lg"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Uploading Screenshot...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Confirm Payment & Complete Registration
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    Your payment will be automatically confirmed once the screenshot is uploaded successfully.
                  </p>
                </CardContent>
              </Card>

              {/* Razorpay Option (Disabled/Coming Soon) */}
              <Card className="border-2 border-gray-200 bg-gray-50 opacity-60">
                <CardHeader className="bg-gradient-to-r from-gray-400 to-gray-500 text-white text-center p-6">
                  <CardTitle className="text-xl font-bold leading-tight">Online Payment</CardTitle>
                  <CardDescription className="text-gray-200 text-base leading-relaxed">
                    Coming Soon - Razorpay Integration
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <Button
                    disabled={true}
                    className="w-full bg-gray-400 cursor-not-allowed text-lg py-6"
                    size="lg"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Pay ₹11 with Razorpay (Coming Soon)
                  </Button>

                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    Secured by Razorpay. Will be available within 1-2 days.
                  </p>
                </CardContent>
              </Card>

            </div>
          </div>
        </section>
      )}

      {/* Confirmation Section */}
      {currentSection === "confirmation" && (
        <section id="confirmation" className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto text-center">
              <Card className="border-0 shadow-2xl">
                <CardHeader className="p-8">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                  <CardTitle className="text-green-900 text-2xl font-bold leading-tight">
                    Registration Confirmed!
                  </CardTitle>
                  <CardDescription className="text-green-700 text-lg leading-relaxed">
                    Payment successful
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-8 space-y-6">
                  <div className="bg-green-50 p-6 rounded-lg">
                    <p className="text-gray-700 leading-relaxed">
                      🎉 Congratulations! You've successfully registered for the MUNIQ Beginner Workshop. You will
                      receive a confirmation email shortly with workshop details and joining instructions.
                    </p>
                  </div>

                  <div className="space-y-3 text-sm text-gray-600">
                    <p>📅 Workshop: 20th July</p>
                    <p>🏆 Certificate will be provided</p>
                  </div>

                  <Button
                    onClick={() => {
                      setCurrentSection("home")
                      scrollToSection("home")
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Back to Homepage
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <Image src="/logo_c_bg.png" alt="MUNIQ Logo" width={50} height={50} />
                <span className="text-3xl font-bold">MUNIQ by AJ</span>
              </div>
              <p className="text-blue-200 mb-6 text-lg leading-relaxed">
                Where diplomats are built. Empowering the next generation of global leaders through comprehensive MUN
                training.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="mailto:muniqbyaj@gmail.com"
                  className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors duration-300 cursor-pointer"
                  title="Email us"
                >
                  <Mail className="w-5 h-5" />
                </a>
                <a 
                  href="tel:+917889244978"
                  className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors duration-300 cursor-pointer"
                  title="Call us"
                >
                  <Phone className="w-5 h-5" />
                </a>
                <a 
                  href="https://www.instagram.com/muniqbyaj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors duration-300 cursor-pointer"
                  title="Follow us on Instagram"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-6 leading-tight">Quick Links</h4>
              <div className="space-y-3">
                {["Home", "About", "Workshop", "Founders"].map((link) => (
                  <button
                    key={link}
                    onClick={() => scrollToSection(link.toLowerCase())}
                    className="block text-blue-200 hover:text-white transition-colors duration-300"
                  >
                    {link}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold mb-6 leading-tight">Legal</h4>
              <div className="space-y-3">
                <Link
                  href="/privacy"
                  className="block text-blue-200 hover:text-white transition-colors duration-300"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/refund"
                  className="block text-blue-200 hover:text-white transition-colors duration-300"
                >
                  Cancellation & Refunds
                </Link>
                <Link
                  href="/terms"
                  className="block text-blue-200 hover:text-white transition-colors duration-300"
                >
                  Terms & Conditions
                </Link>
                <Link
                  href="/shipping"
                  className="block text-blue-200 hover:text-white transition-colors duration-300"
                >
                  Shipping Policy
                </Link>
                <Link
                  href="/contact"
                  className="block text-blue-200 hover:text-white transition-colors duration-300"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>

          <Separator className="bg-blue-700 mb-8" />

          <div className="text-center">
            <p className="text-blue-300 mb-2 leading-relaxed">© 2025 MUNIQ by AJ. All rights reserved.</p>
            <p className="text-blue-400 text-sm leading-relaxed">
              Contact: muniqbyaj@gmail.com | Built with ❤️ for future diplomats
            </p>
          </div>
        </div>
      </footer>


    </div>
  )
}

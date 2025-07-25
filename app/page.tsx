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
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
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

    // Check for selected course in localStorage
    const savedCourse = localStorage.getItem('selected_course')
    if (savedCourse) {
      setSelectedCourse(JSON.parse(savedCourse))
    }

    return () => {
      document.body.removeChild(script)
    }
  }, [currentSection])

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
          courseDetails: selectedCourse,
          timestamp: new Date().toISOString(),
        }),
      )

      // Save to database with course information
      const registrationData = {
        ...data,
        course_id: selectedCourse?.id,
        course_name: selectedCourse?.name,
        course_price: selectedCourse?.price,
      }

      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
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

      if (!selectedCourse) {
        throw new Error("No course selected")
      }

      // Step 1: Create order on server
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: process.env.NODE_ENV === 'development' ? 1 : selectedCourse.price,
          currency: "INR",
          registrationId,
          courseDetails: {
            ...selectedCourse,
            testAmount: process.env.NODE_ENV === 'development' ? 1 : selectedCourse.price
          },
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
        description: `${selectedCourse.name} Registration`,
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
                courseDetails: selectedCourse,
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
              courseDetails: selectedCourse,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              amount: process.env.NODE_ENV === 'development' ? 1 : selectedCourse.price,
              timestamp: new Date().toISOString(),
              verified: true,
            }

            localStorage.setItem("muniq_payment", JSON.stringify(completePaymentData))

            setCurrentSection("confirmation")
            scrollToSection("confirmation")

            toast({
              title: "Payment Successful!",
              description: `Thank you for enrolling in ${selectedCourse.name}. Your registration has been confirmed.`,
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
          course_id: selectedCourse.id,
          course_name: selectedCourse.name,
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
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in-up">
              <Badge className="bg-red-100 text-red-800 px-6 py-2 text-lg font-semibold mb-6">
                🔥 Premium Courses Available
              </Badge>
              <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent mb-6 leading-tight">
                Our Courses
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">Choose the perfect course to accelerate your diplomatic journey</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* MUN Course */}
              <Card className="border-0 shadow-2xl overflow-hidden animate-fade-in-up">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-3xl mb-3 font-bold leading-tight">MUN Mastery Course</CardTitle>
                      <CardDescription className="text-blue-100 text-lg leading-relaxed">
                        Complete MUN training program
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className="bg-white text-blue-600 font-semibold px-4 py-2">
                        <Award className="w-4 h-4 mr-2" />
                        Certificate
                      </Badge>
                      <Badge className="bg-red-500 text-white font-semibold px-4 py-2">
                        Popular
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="text-2xl font-bold text-gray-400 line-through">₹1500/-</div>
                      <div className="text-4xl font-bold text-green-600">₹999/-</div>
                      <Badge className="bg-green-100 text-green-800 font-bold">33% OFF!</Badge>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <h4 className="text-xl font-bold text-blue-900 mb-4">What You'll Learn:</h4>
                    {[
                      "What is MUN?",
                      "Rules of Procedures",
                      "How to write an opening speech with real life examples",
                      "Research and Analysis with real life examples",
                      "Raising POO, Allegations",
                      "Diplomacy and Mindset",
                      "Draft Resolution",
                      "Effective use of Chits",
                      "How to make upto 50k as an EB and how to make career in MUN"
                    ].map((topic, index) => (
                      <div
                        key={topic}
                        className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg"
                      >
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {index + 1}
                        </div>
                        <span className="text-gray-700 font-medium text-sm">{topic}</span>
                      </div>
                    ))}
                  </div>

                  {/* Course Schedule Notice */}
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <h4 className="font-semibold text-blue-800">Course Access</h4>
                    </div>
                    <p className="text-blue-700 text-sm">
                      After payment, <strong>course access details and schedule will be shared with you within 2 working days</strong> via email.
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      localStorage.setItem('selected_course', JSON.stringify({
                        id: 'mun_course',
                        name: 'MUN Mastery Course',
                        price: 999,
                        originalPrice: 1500
                      }));
                      
                      // Show notification for MUN course
                      toast({
                        title: "MUN Mastery Course Selected",
                        description: "Course access details and schedule will be shared with you within 2 working days after payment.",
                        duration: 5000,
                      });
                      
                      scrollToSection("registration");
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Enroll Now - ₹999
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* IP Course */}
              <Card className="border-0 shadow-2xl overflow-hidden animate-fade-in-up animation-delay-300">
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white p-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-3xl mb-3 font-bold leading-tight">IP Mastery Course</CardTitle>
                      <CardDescription className="text-green-100 text-lg leading-relaxed">
                        Photography & Journalism excellence
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className="bg-white text-green-600 font-semibold px-4 py-2">
                        <Award className="w-4 h-4 mr-2" />
                        Certificate
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="text-2xl font-bold text-gray-400 line-through">₹999/-</div>
                      <div className="text-4xl font-bold text-green-600">₹699/-</div>
                      <Badge className="bg-green-100 text-green-800 font-bold">30% OFF!</Badge>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <h4 className="text-xl font-bold text-green-900 mb-4">What You'll Learn:</h4>
                    {[
                      "Tips to be the best photographer",
                      "How to excel in Journalism", 
                      "Marking scheme of IP",
                      "Career in IP"
                    ].map((topic, index) => (
                      <div
                        key={topic}
                        className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg"
                      >
                        <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {index + 1}
                        </div>
                        <span className="text-gray-700 font-medium text-sm">{topic}</span>
                      </div>
                    ))}
                  </div>

                  {/* Course Schedule Notice */}
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <h4 className="font-semibold text-green-800">Course Access</h4>
                    </div>
                    <p className="text-green-700 text-sm">
                      After payment, <strong>course access details and schedule will be shared with you within 2 working days</strong> via email.
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      localStorage.setItem('selected_course', JSON.stringify({
                        id: 'ip_course',
                        name: 'IP Mastery Course',
                        price: 699,
                        originalPrice: 999
                      }));
                      
                      // Show notification for IP course
                      toast({
                        title: "IP Mastery Course Selected",
                        description: "Course access details and schedule will be shared with you within 2 working days after payment.",
                        duration: 5000,
                      });
                      
                      scrollToSection("registration");
                    }}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-lg py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Enroll Now - ₹699
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Strategic 1-1 Call */}
              <Card className="border-0 shadow-2xl overflow-hidden animate-fade-in-up animation-delay-600">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-3xl mb-3 font-bold leading-tight">Strategic 1-1 Call</CardTitle>
                      <CardDescription className="text-purple-100 text-lg leading-relaxed">
                        Personalized guidance session
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className="bg-white text-purple-600 font-semibold px-4 py-2">
                        <Users className="w-4 h-4 mr-2" />
                        1-on-1
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="text-2xl font-bold text-gray-400 line-through">₹500/-</div>
                      <div className="text-4xl font-bold text-green-600">₹349/-</div>
                      <Badge className="bg-green-100 text-green-800 font-bold">30% OFF!</Badge>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <h4 className="text-xl font-bold text-purple-900 mb-4">What You Get:</h4>
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <p className="text-gray-700 leading-relaxed text-center font-medium">
                        Gain individualized insights and personalized Model UN guidance through a dedicated one-on-one session with our experienced advisors. Get tailored strategies, personalized feedback, and answers to your specific questions.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
                        <Clock className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium">60 minutes</span>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium">1-on-1 Session</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      localStorage.setItem('selected_course', JSON.stringify({
                        id: 'strategic_call',
                        name: 'Strategic 1-1 Call',
                        price: 349,
                        originalPrice: 500
                      }));
                      
                      // Show notification for strategic call
                      toast({
                        title: "Strategic 1-1 Call Selected",
                        description: "Our team will reach out to you within 2 working days to schedule your personalized session.",
                        duration: 5000,
                      });
                      
                      scrollToSection("registration");
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-lg py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Book Session - ₹349
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Workshop */}
              <Card className="border-0 shadow-2xl overflow-hidden animate-fade-in-up animation-delay-900">
                <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-3xl mb-3 font-bold leading-tight">Beginner Workshop</CardTitle>
                      <CardDescription className="text-orange-100 text-lg leading-relaxed">
                        Perfect for MUN newcomers
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className="bg-white text-orange-600 font-semibold px-4 py-2">
                        <Award className="w-4 h-4 mr-2" />
                        Certificate
                      </Badge>
                      <Badge className="bg-red-500 text-white font-semibold px-4 py-2">
                        Limited Seats
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div className="text-4xl font-bold text-orange-600">₹499/-</div>
                    </div>
                  </div>

                  {/* Workshop Schedule Notice */}
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <h4 className="font-semibold text-orange-800">Workshop Details</h4>
                    </div>
                    <p className="text-orange-700 text-sm">
                      After payment, <strong>workshop joining link and time will be shared with you within 2 working days</strong> via email and WhatsApp.
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <h4 className="text-xl font-bold text-orange-900 mb-4">Topics Covered:</h4>
                    {[
                      "How to prepare for MUNs",
                      "Research Hacks",
                      "Making Strong Points",
                      "Winning Debates, Not Fights",
                      "Secret Tips to Win"
                    ].map((topic, index) => (
                      <div
                        key={topic}
                        className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg"
                      >
                        <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {index + 1}
                        </div>
                        <span className="text-gray-700 font-medium text-sm">{topic}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => {
                      localStorage.setItem('selected_course', JSON.stringify({
                        id: 'workshop',
                        name: 'Beginner Workshop',
                        price: 499,
                        originalPrice: 499
                      }));
                      
                      // Show notification for workshop
                      toast({
                        title: "Beginner Workshop Selected",
                        description: "Workshop joining link and time will be shared with you within 2 working days after payment.",
                        duration: 5000,
                      });
                      
                      scrollToSection("registration");
                    }}
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-lg py-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Register Now - ₹499
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Download Brochure Section */}
            <div className="text-center mt-12">
              <Button
                onClick={handleBrochureDownload}
                variant="outline"
                size="lg"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white text-lg px-8 py-4 transition-all duration-300 bg-transparent"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Course Brochure
              </Button>
            </div>
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
                {selectedCourse ? `Register for ${selectedCourse.name}` : "Choose a Course First"}
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                {selectedCourse ? "Complete your registration and proceed to payment" : "Please select a course from above to continue"}
              </p>
              
              {/* Selected Course Information */}
              {selectedCourse && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-full">
                      <h3 className="font-bold text-lg">{selectedCourse.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    {selectedCourse.originalPrice !== selectedCourse.price && (
                      <div className="text-xl font-bold text-gray-400 line-through">₹{selectedCourse.originalPrice}/-</div>
                    )}
                    <div className="text-3xl font-bold text-green-600">₹{selectedCourse.price}/-</div>
                    {selectedCourse.originalPrice !== selectedCourse.price && (
                      <Badge className="bg-green-100 text-green-800 font-bold">
                        {Math.round((1 - selectedCourse.price / selectedCourse.originalPrice) * 100)}% OFF!
                      </Badge>
                    )}
                  </div>
                  <div className="flex justify-center gap-2">
                    <Button
                      onClick={() => {
                        localStorage.removeItem('selected_course')
                        setSelectedCourse(null)
                        scrollToSection("workshop")
                      }}
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      Change Course
                    </Button>
                  </div>
                </div>
              )}

              {/* Course Selection Prompt */}
              {!selectedCourse && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-8">
                  <div className="flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <h3 className="text-xl font-bold text-yellow-800">No Course Selected</h3>
                  </div>
                  <p className="text-yellow-700 mb-4">
                    Please select a course from our offerings above to proceed with registration.
                  </p>
                  <Button
                    onClick={() => scrollToSection("workshop")}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    Browse Courses
                  </Button>
                </div>
              )}
            </div>

            {selectedCourse && (
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
                    Proceed to Payment - ₹{process.env.NODE_ENV === 'development' ? 1 : selectedCourse.price}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Payment Section */}
      {currentSection === "payment" && selectedCourse && (
        <section id="payment" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto space-y-6">
              
              {/* Course & Payment Summary */}
              <Card className="border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center p-8">
                  <CardTitle className="text-2xl font-bold leading-tight">Complete Your Payment</CardTitle>
                  <CardDescription className="text-blue-100 text-lg leading-relaxed">
                    Secure payment powered by Razorpay
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-8 space-y-6">
                  {/* Course Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
                    <h3 className="font-bold text-lg text-blue-900 mb-4">{selectedCourse.name}</h3>
                    <div className="space-y-3 text-left">
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
                    
                    {/* Special notice for Strategic 1-1 Call */}
                    {selectedCourse.id === 'strategic_call' && (
                      <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <h4 className="font-semibold text-purple-800">Session Scheduling</h4>
                        </div>
                        <p className="text-purple-700 text-sm">
                          After payment, our team will reach out to you within <strong>2 working days</strong> to schedule your personalized 1-on-1 session at your convenience.
                        </p>
                      </div>
                    )}
                    
                    {/* Special notice for Workshop */}
                    {selectedCourse.id === 'workshop' && (
                      <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <h4 className="font-semibold text-orange-800">Workshop Details</h4>
                        </div>
                        <p className="text-orange-700 text-sm">
                          After payment, <strong>workshop joining link and time will be shared with you within 2 working days</strong> via email and WhatsApp.
                        </p>
                      </div>
                    )}
                    
                    {/* Special notice for MUN Course */}
                    {selectedCourse.id === 'mun_course' && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <h4 className="font-semibold text-blue-800">Course Access</h4>
                        </div>
                        <p className="text-blue-700 text-sm">
                          After payment, <strong>course access details and schedule will be shared with you within 2 working days</strong> via email.
                        </p>
                      </div>
                    )}
                    
                    {/* Special notice for IP Course */}
                    {selectedCourse.id === 'ip_course' && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <h4 className="font-semibold text-green-800">Course Access</h4>
                        </div>
                        <p className="text-green-700 text-sm">
                          After payment, <strong>course access details and schedule will be shared with you within 2 working days</strong> via email.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      {selectedCourse.originalPrice !== selectedCourse.price && (
                        <div className="text-2xl font-bold text-gray-400 line-through">₹{selectedCourse.originalPrice}/-</div>
                      )}
                      <div className="text-4xl font-bold text-green-600">
                        ₹{process.env.NODE_ENV === 'development' ? 1 : selectedCourse.price}/-
                      </div>
                      {selectedCourse.originalPrice !== selectedCourse.price && (
                        <Badge className="bg-green-100 text-green-800 font-bold">
                          {Math.round((1 - selectedCourse.price / selectedCourse.originalPrice) * 100)}% OFF!
                        </Badge>
                      )}
                      {process.env.NODE_ENV === 'development' && (
                        <Badge className="bg-yellow-100 text-yellow-800 font-bold animate-pulse">
                          TEST MODE
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mb-6 leading-relaxed">{selectedCourse.name}</p>
                    {process.env.NODE_ENV === 'development' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-yellow-700 text-sm font-semibold">
                          🧪 Development Mode: Testing with ₹1 instead of ₹{selectedCourse.price}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Payment Instructions */}
                  <div className="bg-green-50 p-6 rounded-lg space-y-4">
                    <h3 className="font-bold text-lg text-green-800">Payment Process:</h3>
                    <ol className="space-y-2 text-sm text-green-700">
                      <li className="flex items-start gap-2">
                        <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                        <span>Click "Pay Now" to open secure Razorpay payment gateway</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                        <span>Choose from UPI, Cards, Net Banking, or Wallet</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                        <span>Complete payment securely and get instant confirmation</span>
                      </li>
                    </ol>
                  </div>

                  {/* Payment Button */}
                  <Button
                    onClick={handlePayment}
                    disabled={isLoading}
                    className={`w-full text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                      isLoading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    }`}
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Pay ₹{process.env.NODE_ENV === 'development' ? 1 : selectedCourse.price} - Razorpay
                        <ExternalLink className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* Security Notice */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <h4 className="font-semibold text-blue-800">Secure Payment</h4>
                    </div>
                    <p className="text-blue-700 text-sm">
                      Your payment is secured by Razorpay with industry-standard encryption. We don't store your payment information.
                    </p>
                  </div>

                  {/* Back to Registration Button */}
                  <div className="text-center">
                    <Button
                      onClick={() => {
                        setCurrentSection("registration")
                        scrollToSection("registration")
                      }}
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    >
                      ← Back to Registration
                    </Button>
                  </div>
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
                      🎉 Congratulations! You've successfully enrolled in <strong>{selectedCourse?.name || "the selected course"}</strong>. You will
                      receive a confirmation email shortly with course details and access instructions.
                    </p>
                  </div>

                  {selectedCourse && (
                    <div className="space-y-3 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
                      <div className="flex justify-between">
                        <span className="font-medium">Course:</span>
                        <span>{selectedCourse.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Amount Paid:</span>
                        <span className="font-bold text-green-600">₹{selectedCourse.price}</span>
                      </div>
                      {selectedCourse.originalPrice !== selectedCourse.price && (
                        <div className="flex justify-between">
                          <span className="font-medium">You Saved:</span>
                          <span className="font-bold text-green-600">₹{selectedCourse.originalPrice - selectedCourse.price}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 text-sm text-gray-600">
                    <p>📧 Confirmation email will arrive within 5 minutes</p>
                    <p>🏆 {selectedCourse?.id === 'strategic_call' ? 'Session details will be shared separately' : 'Certificate will be provided upon completion'}</p>
                    {selectedCourse?.id === 'strategic_call' && (
                      <p className="font-semibold text-purple-600">📞 Our team will reach out to you within 2 working days to schedule your personalized session</p>
                    )}
                    {selectedCourse?.id === 'workshop' && (
                      <p className="font-semibold text-orange-600">🔗 Workshop joining link and time will be shared with you within 2 working days</p>
                    )}
                    {selectedCourse?.id === 'mun_course' && (
                      <p className="font-semibold text-blue-600">📚 Course access details and schedule will be shared with you within 2 working days</p>
                    )}
                    {selectedCourse?.id === 'ip_course' && (
                      <p className="font-semibold text-green-600">📚 Course access details and schedule will be shared with you within 2 working days</p>
                    )}
                    <p>📞 Contact support if you need any assistance</p>
                  </div>

                  <Button
                    onClick={() => {
                      setCurrentSection("home")
                      scrollToSection("home")
                      // Clear course selection
                      localStorage.removeItem('selected_course')
                      setSelectedCourse(null)
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

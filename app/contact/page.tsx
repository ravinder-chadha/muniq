import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mail, Phone, MapPin, Clock, ExternalLink } from "lucide-react"

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <Image src="/logo_c_bg.png" alt="MUNIQ Logo" width={50} height={50} />
              <span className="text-2xl font-bold">MUNIQ by AJ</span>
            </Link>
            <Link href="/">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-900 mb-4">Contact Us</h1>
            <p className="text-xl text-gray-600">We're here to help you with your MUN journey. Reach out to us anytime!</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-blue-900 flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Email Us
                  </CardTitle>
                  <CardDescription>Send us your questions and we'll respond within 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <a 
                    href="mailto:muniqbyaj@gmail.com"
                    className="text-blue-600 hover:text-blue-800 text-lg font-medium"
                  >
                    muniqbyaj@gmail.com
                  </a>
                  <p className="text-gray-600 mt-2">
                    Best for: General inquiries, registration questions, technical support
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-blue-900 flex items-center">
                    <Phone className="w-5 h-5 mr-2" />
                    Call Us
                  </CardTitle>
                  <CardDescription>Speak directly with our team</CardDescription>
                </CardHeader>
                <CardContent>
                  <a 
                    href="tel:+917889244978"
                    className="text-blue-600 hover:text-blue-800 text-lg font-medium"
                  >
                    +91 7889244978
                  </a>
                  <p className="text-gray-600 mt-2">
                    Available: Monday - Saturday, 10:00 AM - 8:00 PM (IST)
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-blue-900 flex items-center">
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Follow Us
                  </CardTitle>
                  <CardDescription>Stay updated with our latest workshops and tips</CardDescription>
                </CardHeader>
                <CardContent>
                  <a 
                    href="https://www.instagram.com/muniqbyaj"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-lg font-medium"
                  >
                    @muniqbyaj
                  </a>
                  <p className="text-gray-600 mt-2">
                    Get MUN tips, workshop updates, and success stories
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-blue-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Response Times
                  </CardTitle>
                  <CardDescription>When you can expect to hear from us</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li>📧 Email: Within 24 hours</li>
                    <li>📞 Phone: Immediate during business hours</li>
                    <li>📱 Instagram: Within 12 hours</li>
                    <li>🚨 Urgent workshop issues: Within 2 hours</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Additional Information */}
            <div className="space-y-8">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-blue-900">Frequently Asked Questions</CardTitle>
                  <CardDescription>Quick answers to common questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">How do I register for a workshop?</h4>
                    <p className="text-gray-600">Visit our homepage, click "Register Now", fill out the form, and complete the payment process.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">What if I miss the workshop?</h4>
                    <p className="text-gray-600">Workshop recordings are not available. Please ensure you can attend the scheduled time before registering.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Do you offer refunds?</h4>
                    <p className="text-gray-600">Refunds are available only in exceptional circumstances. Please review our refund policy for details.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Is the certificate recognized?</h4>
                    <p className="text-gray-600">Yes, our completion certificates are recognized and can be added to your academic/professional portfolio.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-blue-900">Workshop Support</CardTitle>
                  <CardDescription>Need help during or after the workshop?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Technical Issues</h4>
                        <p className="text-gray-600">Contact us immediately for zoom/access problems</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Certificate Queries</h4>
                        <p className="text-gray-600">Certificates are issued within 48 hours of completion</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Content Questions</h4>
                        <p className="text-gray-600">Follow up on workshop content via email</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-blue-900">Partnership & Collaboration</CardTitle>
                  <CardDescription>Interested in working with us?</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    We welcome partnerships with educational institutions, MUN societies, and organizations interested in promoting diplomatic education.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">Partnership Opportunities:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• School/College workshop programs</li>
                      <li>• MUN society training sessions</li>
                      <li>• Educational institution partnerships</li>
                      <li>• Corporate training programs</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Form Section */}
          <div className="mt-16">
            <Card className="border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <CardTitle className="text-2xl">Send us a Message</CardTitle>
                <CardDescription className="text-blue-100">
                  Can't find what you're looking for? Send us a detailed message and we'll get back to you.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center">
                  <p className="text-gray-600 mb-6">
                    For the best support experience, please email us directly at:
                  </p>
                  <a 
                    href="mailto:muniqbyaj@gmail.com?subject=MUNIQ Workshop Inquiry"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Send Email
                  </a>
                  <p className="text-sm text-gray-500 mt-4">
                    Please include: Your name, contact number, and detailed description of your inquiry
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 MUNIQ by AJ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
} 
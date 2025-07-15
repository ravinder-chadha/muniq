import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TermsConditions() {
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-blue-900 mb-8">Terms and Conditions</h1>
          
          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p>
              <strong>Effective Date:</strong> January 11, 2025
            </p>
            <p>
              Welcome to MUNIQ by AJ. These Terms and Conditions ("Terms") govern your use of our website and services. By accessing our website or registering for our workshops, you agree to be bound by these Terms.
            </p>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By using this website and/or registering for MUNIQ by AJ workshops, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">2. Workshop Registration</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Registration is open to students and professionals interested in Model United Nations</li>
              <li>All information provided during registration must be accurate and truthful</li>
              <li>Participants must be at least 13 years old or have parental consent</li>
              <li>MUNIQ by AJ reserves the right to refuse registration to any individual</li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">3. Payment Terms</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payment is required in full at the time of registration</li>
              <li>All payments are processed securely through Razorpay</li>
              <li>Prices are subject to change without notice</li>
              <li>Payment confirms your registration and reserves your seat</li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">4. Workshop Attendance</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Participants are expected to attend all scheduled sessions</li>
              <li>Punctuality is required for all workshop activities</li>
              <li>Disruptive behavior may result in removal from the workshop</li>
              <li>Certificates are issued only upon successful completion of the workshop</li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">5. Intellectual Property</h2>
            <p>
              All workshop materials, content, and resources provided by MUNIQ by AJ are protected by copyright and intellectual property laws. Participants may not:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reproduce, distribute, or sell workshop materials</li>
              <li>Record or stream workshop sessions without permission</li>
              <li>Use MUNIQ by AJ branding or materials for commercial purposes</li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">6. Limitation of Liability</h2>
            <p>
              MUNIQ by AJ shall not be liable for any indirect, incidental, special, or consequential damages arising from your participation in our workshops or use of our services.
            </p>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">7. Code of Conduct</h2>
            <p>Participants are expected to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Treat all participants and instructors with respect</li>
              <li>Maintain professional behavior during all sessions</li>
              <li>Respect diverse opinions and viewpoints</li>
              <li>Follow all workshop rules and guidelines</li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">8. Modifications to Terms</h2>
            <p>
              MUNIQ by AJ reserves the right to modify these Terms at any time. Changes will be effective immediately upon posting on our website. Continued use of our services constitutes acceptance of modified Terms.
            </p>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">9. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in India.
            </p>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">10. Contact Information</h2>
            <p>For any questions about these Terms and Conditions, please contact:</p>
            <p>📧 Email: muniqbyaj@gmail.com</p>
            <p>📞 Phone: +91 7889244978</p>
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
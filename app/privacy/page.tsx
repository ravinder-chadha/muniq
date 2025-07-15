import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold text-blue-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p>
              <strong>Effective Date:</strong> January 11, 2025
            </p>
            <p>
              This Privacy Policy describes how MUNIQ by AJ ("we", "us", or "our") collects, uses, shares, and
              protects personal information provided by users ("you" or "your") when registering for our workshop
              through our website.
            </p>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">
              1. Information We Collect
            </h2>
            <p>
              When you register or make a payment on our website, we collect the following personal information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Full Name</li>
              <li>Email Address</li>
              <li>Phone Number</li>
              <li>Institution Name</li>
              <li>Age / Class / Designation (if applicable)</li>
              <li>Payment Details (processed securely through Razorpay)</li>
            </ul>
            <p>
              We do not store any sensitive payment data such as card numbers or CVV. All such transactions are
              securely processed via Razorpay.
            </p>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">
              2. Use of Your Information
            </h2>
            <p>We use your data solely for the purpose of:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Registering you for the MUN workshop</li>
              <li>Sending you confirmation, updates, or event-related notifications</li>
              <li>Processing payments and issuing receipts</li>
              <li>Generating participation certificates</li>
              <li>Internal reporting and feedback collection</li>
            </ul>
            <p>
              We do not use your personal information for marketing or share it with third parties without your
              explicit consent.
            </p>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">
              3. Payment Processing via Razorpay
            </h2>
            <p>
              We use Razorpay to handle all payments. Razorpay is PCI-DSS compliant, ensuring your payment data is
              encrypted and handled with high security standards.
            </p>
            <p>
              For more details on Razorpay's privacy practices, please visit:{" "}
              <a
                href="https://razorpay.com/privacy/"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://razorpay.com/privacy/
              </a>
            </p>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Request access to your personal information</li>
              <li>Request correction of your personal information</li>
              <li>Request deletion of your personal information</li>
              <li>Withdraw consent for processing your personal information</li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">6. Contact Us</h2>
            <p>If you have any concerns or queries about this Privacy Policy, you can reach out to:</p>
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
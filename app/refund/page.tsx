import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function RefundPolicy() {
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
          <h1 className="text-4xl font-bold text-blue-900 mb-8">Cancellation & Refund Policy</h1>
          
          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p>
              <strong>Effective Date:</strong> January 11, 2025
            </p>
            <p>
              This Cancellation & Refund Policy outlines the terms and conditions for cancellations and refunds for MUNIQ by AJ workshop registrations.
            </p>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">1. No Return of Services</h2>
            <p>
              As this is an educational event, the services (registration, participation, training sessions,
              materials, etc.) are intangible and time-bound. Therefore, once a registration is completed and
              payment is made, returns are not applicable.
            </p>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">2. Refund Eligibility</h2>
            <p>We offer refunds only under the following exceptional circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Double Payment:</strong> If a delegate has made more than one payment for the same
                registration due to a technical or manual error.
              </li>
              <li>
                <strong>Event Cancellation:</strong> If the event is cancelled by the organizers, a full refund
                will be issued to all registered participants.
              </li>
              <li>
                <strong>Eligibility Error:</strong> If you registered but later found ineligible due to age,
                background, or other specific workshop prerequisites outlined during registration, and if this is
                communicated within 48 hours of payment.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">3. Refund Process</h2>
            <p>To request a refund under eligible circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Contact us within 48 hours of payment</li>
              <li>Provide transaction details and reason for refund</li>
              <li>Refunds will be processed within 7-10 business days</li>
              <li>Refunds will be credited to the original payment method</li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">4. Cancellation by Organizers</h2>
            <p>
              In the unlikely event that MUNIQ by AJ needs to cancel a workshop due to unforeseen circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Participants will be notified at least 24 hours in advance</li>
              <li>Full refund will be processed automatically</li>
              <li>Alternative workshop dates may be offered</li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">5. Non-Refundable Items</h2>
            <p>The following are non-refundable under any circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Completed workshop sessions</li>
              <li>Downloaded materials and resources</li>
              <li>Issued certificates</li>
              <li>Payment processing fees</li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">6. Contact for Refunds</h2>
            <p>For any questions regarding this policy or to initiate a refund request, please contact:</p>
            <p>📧 Email: muniqbyaj@gmail.com</p>
            <p>📞 Phone: +91 7889244978</p>
            <p>Please include your transaction ID and detailed reason for the refund request.</p>
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
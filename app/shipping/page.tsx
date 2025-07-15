import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function ShippingPolicy() {
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
          <h1 className="text-4xl font-bold text-blue-900 mb-8">Shipping Policy</h1>
          
          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p>
              <strong>Effective Date:</strong> January 11, 2025
            </p>
            <p>
              This Shipping Policy explains the delivery method for MUNIQ by AJ services and materials. Since our workshops are conducted online, this policy covers digital delivery and any physical materials that may be provided.
            </p>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">1. Digital Service Delivery</h2>
            <p>
              MUNIQ by AJ provides educational workshops and training through digital platforms. Our services are delivered electronically and do not involve physical shipping.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Workshop access details are sent via email within 24 hours of registration</li>
              <li>Digital materials are provided through secure online platforms</li>
              <li>No physical shipping is required for workshop participation</li>
              <li>All resources are accessible online during and after the workshop</li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">2. Electronic Materials</h2>
            <p>The following materials are delivered electronically:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Workshop joining links and access credentials</li>
              <li>Digital handouts and reference materials</li>
              <li>Certificate of completion (PDF format)</li>
              <li>Resource links and additional reading materials</li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">3. Delivery Timeline</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Registration Confirmation:</strong> Immediate email upon successful payment</li>
              <li><strong>Workshop Details:</strong> Within 24 hours of registration</li>
              <li><strong>Pre-workshop Materials:</strong> 48 hours before the workshop</li>
              <li><strong>Certificate:</strong> Within 48 hours of workshop completion</li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">4. Physical Materials (If Applicable)</h2>
            <p>
              In rare cases where physical materials are provided (such as promotional items or special workshop kits), the following applies:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Shipping is available within India only</li>
              <li>Standard shipping takes 5-7 business days</li>
              <li>Tracking information will be provided via email</li>
              <li>Physical materials are complementary to digital services</li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">5. Technical Requirements</h2>
            <p>To receive and access our digital services, you need:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>A stable internet connection</li>
              <li>A device capable of video conferencing (computer, tablet, or smartphone)</li>
              <li>A valid email address for receiving materials</li>
              <li>Basic software for viewing PDFs and accessing online platforms</li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">6. Access Issues</h2>
            <p>If you experience any issues accessing your digital materials or workshop:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Check your spam/junk folder for emails</li>
              <li>Ensure your internet connection is stable</li>
              <li>Contact our support team for technical assistance</li>
              <li>Alternative access methods may be provided if needed</li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">7. International Participants</h2>
            <p>
              Our online workshops are accessible globally. However, please note:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Workshops are conducted in India Standard Time (IST)</li>
              <li>Physical materials (if any) are shipped within India only</li>
              <li>Digital materials are accessible worldwide</li>
              <li>Time zone differences should be considered when registering</li>
            </ul>

            <h2 className="text-2xl font-bold text-blue-900 mt-8 mb-4">8. Contact for Delivery Issues</h2>
            <p>For any questions about service delivery or access issues, please contact:</p>
            <p>📧 Email: muniqbyaj@gmail.com</p>
            <p>📞 Phone: +91 7889244978</p>
            <p>Our support team will respond within 24 hours to resolve any delivery-related concerns.</p>
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
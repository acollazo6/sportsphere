import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowLeft, Shield, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <Link to={createPageUrl("Feed")} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-red-900">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-10 h-10" />
          <h1 className="text-4xl font-black">Terms of Service</h1>
        </div>
        <p className="text-white/90 text-lg">User Agreement and Legal Waiver</p>
        <p className="text-white/70 text-sm mt-2">Last Updated: February 14, 2026</p>
      </div>

      <Card className="bg-yellow-50 border-yellow-300">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-700 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-yellow-900 mb-2">Important Legal Notice</h3>
              <p className="text-sm text-yellow-800">
                By using SportHub, you agree to assume all risks associated with sports activities. 
                Please read these terms carefully before using our platform.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardContent className="p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using SportHub ("the Platform"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, you may not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Assumption of Risk</h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p className="font-semibold text-gray-900">
                YOU ACKNOWLEDGE AND AGREE THAT:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Sports activities involve inherent risks of physical injury, disability, or death</li>
                <li>You voluntarily assume all risks associated with sports activities, training, and coaching obtained through this Platform</li>
                <li>You are responsible for consulting with healthcare professionals before beginning any exercise or training program</li>
                <li>You use all content, advice, and coaching at your own risk</li>
                <li>You will not hold SportHub, its owners, operators, coaches, or users liable for any injuries or damages</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Limitation of Liability</h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p className="font-semibold text-red-900 uppercase">
                SPORTHUB AND ITS AFFILIATES ACCEPT NO LIABILITY OR RESPONSIBILITY FOR:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Any injuries, damages, or losses resulting from sports activities</li>
                <li>Any advice, coaching, or content provided by users or coaches on the Platform</li>
                <li>The accuracy, safety, or appropriateness of any training programs or advice</li>
                <li>Any direct, indirect, incidental, consequential, or punitive damages</li>
                <li>Equipment failure, facility conditions, or third-party actions</li>
                <li>Health complications arising from physical activity</li>
              </ul>
              <p className="font-semibold mt-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SPORTHUB'S TOTAL LIABILITY SHALL NOT EXCEED 
                THE AMOUNT YOU PAID TO USE THE PLATFORM IN THE PAST 12 MONTHS.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Waiver and Release</h2>
            <p className="text-gray-700 leading-relaxed">
              You hereby WAIVE, RELEASE, and DISCHARGE SportHub, its owners, operators, employees, 
              coaches, and affiliates from any and all claims, demands, losses, liabilities, damages, 
              or expenses (including attorney fees) arising from your use of the Platform or 
              participation in any sports activities, whether caused by negligence or otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Medical Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              SportHub does not provide medical advice. All content is for informational and 
              educational purposes only. You should consult with a qualified healthcare professional 
              before starting any exercise program or making changes to your training regimen.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. User Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>You are responsible for your own safety and well-being</li>
              <li>You must ensure you are physically capable of participating in sports activities</li>
              <li>You must use proper equipment and follow safety guidelines</li>
              <li>You must not exceed your physical limitations</li>
              <li>You must seek immediate medical attention if injured</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify, defend, and hold harmless SportHub and its affiliates from any 
              claims, damages, losses, liabilities, and expenses arising from your use of the Platform 
              or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. No Warranty</h2>
            <p className="text-gray-700 leading-relaxed">
              THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. 
              SPORTHUB DOES NOT WARRANT THAT THE PLATFORM WILL BE ERROR-FREE, UNINTERRUPTED, OR SECURE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Modifications</h2>
            <p className="text-gray-700 leading-relaxed">
              SportHub reserves the right to modify these Terms at any time. Continued use of the 
              Platform after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms, please contact us through the Platform's support channels.
            </p>
          </section>

          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mt-8">
            <p className="font-bold text-red-900 mb-2">BY USING SPORTHUB, YOU ACKNOWLEDGE THAT:</p>
            <ul className="list-disc pl-6 space-y-1 text-red-800">
              <li>You have read and understood these Terms</li>
              <li>You voluntarily assume all risks</li>
              <li>You waive all claims against SportHub</li>
              <li>You agree to use the Platform safely and responsibly</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
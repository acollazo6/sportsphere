import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowLeft, BookOpen, CheckCircle, XCircle, Flag, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Guidelines() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <Link to={createPageUrl("Feed")} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-red-900">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-10 h-10" />
          <h1 className="text-4xl font-black">Community Guidelines</h1>
        </div>
        <p className="text-white/90 text-lg">Building a positive and safe sports community</p>
        <p className="text-white/70 text-sm mt-2">Last Updated: February 14, 2026</p>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <Heart className="w-6 h-6 text-blue-700 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Our Mission</h3>
              <p className="text-sm text-blue-800">
                SportHub is dedicated to sports, fitness, and athletic development. We're building a 
                community where athletes, coaches, and sports enthusiasts can connect, learn, and grow together.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardContent className="p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              What SportHub Is For
            </h2>
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                SportHub is exclusively for sports-related content and activities:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Sports training, coaching, and instruction</li>
                <li>Fitness and athletic performance content</li>
                <li>Sports highlights, game footage, and competitions</li>
                <li>Training programs, workout routines, and exercises</li>
                <li>Sports equipment reviews and recommendations</li>
                <li>Team building and sports community activities</li>
                <li>Motivation and inspiration related to athletics</li>
                <li>Sports analysis, techniques, and strategies</li>
                <li>Athletic achievements and personal records</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <XCircle className="w-6 h-6 text-red-600" />
              Strictly Prohibited Content
            </h2>
            <div className="space-y-4">
              <div className="bg-red-50 border-l-4 border-red-600 p-4">
                <p className="font-semibold text-red-900 mb-2">The following content is STRICTLY FORBIDDEN and will result in immediate removal and possible account suspension:</p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-600">Prohibited</Badge>
                    <h3 className="font-bold text-gray-900">Political Content</h3>
                  </div>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Political statements, endorsements, or campaigns</li>
                    <li>Political debates or discussions</li>
                    <li>Partisan messaging or propaganda</li>
                    <li>Government policy debates unrelated to sports</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-600">Prohibited</Badge>
                    <h3 className="font-bold text-gray-900">Religious Content</h3>
                  </div>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Religious preaching or proselytizing</li>
                    <li>Religious debates or discussions</li>
                    <li>Content promoting or criticizing any religion</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-600">Prohibited</Badge>
                    <h3 className="font-bold text-gray-900">Sexual Content</h3>
                  </div>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Sexually explicit material or nudity</li>
                    <li>Sexual solicitation or advances</li>
                    <li>Inappropriate or suggestive content</li>
                    <li>Content sexualizing athletes or users</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-600">Prohibited</Badge>
                    <h3 className="font-bold text-gray-900">Discrimination & Hate Speech</h3>
                  </div>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Racist, sexist, or discriminatory content</li>
                    <li>Hate speech targeting any group</li>
                    <li>Content attacking people based on race, ethnicity, gender, sexual orientation, religion, disability, or nationality</li>
                    <li>Slurs, derogatory language, or offensive stereotypes</li>
                    <li>Promotion of hate groups or extremist ideologies</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Additional Prohibited Behavior</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Harassment & Bullying:</strong> No cyberbullying, threats, or targeted harassment</li>
              <li><strong>Profanity:</strong> Excessive or aggressive use of profane language</li>
              <li><strong>Spam:</strong> Repetitive content, excessive self-promotion, or unsolicited advertising</li>
              <li><strong>Misinformation:</strong> Deliberately false or misleading sports information</li>
              <li><strong>Impersonation:</strong> Pretending to be another person or organization</li>
              <li><strong>Illegal Activity:</strong> Content promoting illegal activities or substances</li>
              <li><strong>Violence:</strong> Content glorifying or encouraging violence</li>
              <li><strong>Dangerous Activities:</strong> Promoting unsafe training practices or extreme risks</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Expected Behavior</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Be Respectful:</strong> Treat all users with respect and courtesy</li>
              <li><strong>Stay on Topic:</strong> Keep content focused on sports and fitness</li>
              <li><strong>Be Constructive:</strong> Offer helpful feedback and encouragement</li>
              <li><strong>Be Authentic:</strong> Share genuine content and experiences</li>
              <li><strong>Be Safe:</strong> Promote safe training practices and techniques</li>
              <li><strong>Be Inclusive:</strong> Welcome athletes of all levels and backgrounds</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Flag className="w-6 h-6 text-red-900" />
              Reporting Violations
            </h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you see content that violates these guidelines, please report it immediately using the report button. 
              Our moderation team reviews all reports and takes appropriate action.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-700">
                <strong>What happens when you report:</strong> Reports are reviewed by our team, and violations 
                result in content removal and potential account penalties including warnings, temporary suspension, 
                or permanent ban depending on severity.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Consequences</h2>
            <div className="space-y-3 text-gray-700">
              <p className="font-semibold">Violations of these guidelines may result in:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>First Offense:</strong> Warning and content removal</li>
                <li><strong>Second Offense:</strong> Temporary account suspension (7-30 days)</li>
                <li><strong>Severe or Repeated Violations:</strong> Permanent account ban</li>
                <li><strong>Illegal Activity:</strong> Report to authorities and immediate permanent ban</li>
              </ul>
              <p className="text-sm text-gray-600 mt-3">
                Note: Severe violations (threats, illegal content, extreme hate speech) may result in immediate permanent ban without warning.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Content Moderation</h2>
            <p className="text-gray-700 leading-relaxed">
              SportHub uses AI-powered content moderation to automatically detect and flag prohibited content. 
              While we strive for accuracy, our human moderation team makes final decisions on all reports.
            </p>
          </section>

          <div className="bg-gradient-to-r from-red-900 to-red-800 rounded-xl p-6 text-white mt-8">
            <h3 className="font-bold text-xl mb-3">Remember: SportHub is for Sports Only!</h3>
            <p className="text-white/90">
              We're building a positive community focused on athletic excellence, training, and sportsmanship. 
              Help us keep SportHub a safe, welcoming space for all athletes by following these guidelines.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
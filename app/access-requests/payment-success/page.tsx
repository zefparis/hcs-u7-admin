/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { CheckCircle, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">
            Payment Successful!
          </CardTitle>
          <CardDescription className="text-base">
            Thank you for your subscription to HCS-U7
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Check Your Email
            </h3>
            <p className="text-sm text-green-700">
              We&apos;ve sent your login credentials to your email address. 
              You&apos;ll receive:
            </p>
            <ul className="mt-2 text-sm text-green-700 space-y-1">
              <li>• Your dashboard URL</li>
              <li>• Your login email</li>
              <li>• Your temporary password</li>
              <li>• Your API key</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">What&apos;s Next?</h3>
            <ol className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                <span>Check your email for login credentials</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                <span>Log in to your HCS-U7 dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                <span>Integrate HCS-U7 into your application</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
                <span>Start protecting your users!</span>
              </li>
            </ol>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="https://hcs-u7.online" target="_blank" className="w-full">
              <Button className="w-full">
                Go to Client Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>

          <p className="text-xs text-center text-gray-500">
            Need help? Contact us at{" "}
            <a href="mailto:support@hcs-u7.tech" className="text-primary hover:underline">
              support@hcs-u7.tech
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

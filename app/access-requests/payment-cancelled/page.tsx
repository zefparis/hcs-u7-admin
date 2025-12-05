/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

import { XCircle, RefreshCw, HelpCircle } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-orange-600" />
          </div>
          <CardTitle className="text-2xl text-gray-700">
            Payment Cancelled
          </CardTitle>
          <CardDescription className="text-base">
            Your payment was not completed
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-800 mb-2">
              Don&apos;t worry!
            </h3>
            <p className="text-sm text-orange-700">
              Your access request is still approved. You can complete the payment 
              at any time using the link we sent to your email.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Common reasons for cancellation
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Changed your mind about the plan</li>
              <li>• Need to verify payment details</li>
              <li>• Technical issues with payment method</li>
              <li>• Want to discuss options with your team</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Ready to try again?
            </h3>
            <p className="text-sm text-blue-700">
              Check your email for the payment link, or contact us if you need 
              a new one sent.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/" className="w-full">
              <Button className="w-full">
                Back to Home
              </Button>
            </Link>
            <a href="mailto:support@hcs-u7.tech" className="w-full">
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </a>
          </div>

          <p className="text-xs text-center text-gray-500">
            Your payment link expires in 24 hours. Need a new link?{" "}
            <a href="mailto:support@hcs-u7.tech" className="text-primary hover:underline">
              Contact us
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

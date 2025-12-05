/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

"use client";

import { useState } from "react";
import { CheckCircle, Building2, Mail, User, Briefcase, BarChart3, CreditCard } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface AccessRequest {
  id: string;
  email: string;
  fullName: string;
  company: string;
  useCase: string;
  estimatedVolume: string;
  message: string | null;
  hcsCode: string;
  status: string;
  createdAt: string;
}

interface ApproveRequestModalProps {
  request: AccessRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PLAN_OPTIONS = [
  { value: "STARTER", label: "Starter", price: 49, quota: "10,000 requests/month" },
  { value: "PRO", label: "Pro", price: 149, quota: "100,000 requests/month" },
];

const USE_CASE_LABELS: Record<string, string> = {
  banking: "Banking & Finance",
  ecommerce: "E-commerce",
  api: "API Platform",
  other: "Other",
};

const VOLUME_LABELS: Record<string, string> = {
  "1k-10k": "1,000 - 10,000",
  "10k-100k": "10,000 - 100,000",
  "100k-1M": "100,000 - 1,000,000",
  "1M+": "1,000,000+",
};

export function ApproveRequestModal({
  request,
  open,
  onOpenChange,
  onSuccess,
}: ApproveRequestModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<string>("STARTER");
  const [notes, setNotes] = useState<string>("");
  
  const selectedPlan = PLAN_OPTIONS.find(p => p.value === plan) || PLAN_OPTIONS[0];


  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/access-requests/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          plan,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve request");
      }

      toast({
        title: "Request approved successfully",
        description: `Payment link sent to ${request.email}`,
        variant: "default",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Approve Access Request
          </DialogTitle>
          <DialogDescription>
            Send a Stripe payment link to the prospect. The tenant will be created after payment.
          </DialogDescription>
        </DialogHeader>

        {/* Request Info */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <h4 className="text-sm font-medium text-slate-700">Request Details</h4>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="font-medium">{request.company}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <span>{request.fullName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">{request.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-slate-400" />
              <Badge variant="default">{USE_CASE_LABELS[request.useCase] || request.useCase}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">{VOLUME_LABELS[request.estimatedVolume] || request.estimatedVolume} req/mo</span>
            </div>
            <div className="flex items-center gap-2">
              {request.hcsCode ? (
                <Badge variant="success">HCS-U7 Code Available</Badge>
              ) : (
                <Badge variant="warning">No HCS Code</Badge>
              )}
            </div>
          </div>

          {request.message && (
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500">Message:</p>
              <p className="text-sm text-slate-700 mt-1">{request.message}</p>
            </div>
          )}
        </div>

        {/* Configuration */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-slate-700">Select Plan</h4>

          <div className="space-y-2">
            <Label htmlFor="plan">Subscription Plan</Label>
            <Select
              id="plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            >
              {PLAN_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - €{option.price}/month ({option.quota})
                </option>
              ))}
            </Select>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-2">
              <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Payment Process</p>
                <p className="text-blue-700">
                  A Stripe checkout link will be sent to <strong>{request.email}</strong>.
                  The link includes:
                </p>
                <ul className="mt-2 ml-4 list-disc text-blue-700">
                  <li>{selectedPlan.label} plan: €{selectedPlan.price}/month</li>
                  <li>14 days free trial included</li>
                  <li>Automatic tenant creation after payment</li>
                  <li>Welcome email with credentials</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Admin Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this approval..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Approve & Send Payment Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

"use client";

import { useState } from "react";
import { Copy, Check, User, Building, Mail, Globe, Clock, FileText, Fingerprint } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface AccessRequest {
  id: string;
  email: string;
  fullName: string;
  company: string;
  useCase: string;
  estimatedVolume: string;
  message: string | null;
  hcsCode: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  ipAddress: string;
  userAgent: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ViewRequestModalProps {
  request: AccessRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "warning" | "success" | "destructive" }> = {
  PENDING: { label: "Pending", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

const USE_CASE_LABELS: Record<string, string> = {
  banking: "Banking",
  ecommerce: "E-commerce",
  api: "API Platform",
  other: "Other",
};

export function ViewRequestModal({ request, open, onOpenChange }: ViewRequestModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
      onClick={() => copyToClipboard(text, field)}
    >
      {copiedField === field ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl">Request Details</DialogTitle>
            <Badge variant={STATUS_CONFIG[request.status]?.variant || "secondary"}>
              {STATUS_CONFIG[request.status]?.label || request.status}
            </Badge>
          </div>
          <DialogDescription>
            Request ID: {request.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Full Name</div>
                <div className="font-medium flex items-center gap-2">
                  {request.fullName}
                  <CopyButton text={request.fullName} field="fullName" />
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Company</div>
                <div className="font-medium flex items-center gap-2">
                  <Building className="h-4 w-4 text-slate-400" />
                  {request.company}
                  <CopyButton text={request.company} field="company" />
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-slate-500 mb-1">Email</div>
                <div className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  {request.email}
                  <CopyButton text={request.email} field="email" />
                </div>
              </div>
            </div>
          </div>

          {/* HCS Code - Highlighted Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Fingerprint className="h-4 w-4" />
              HCS-U7 Code
            </h3>
            <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4">
              {request.hcsCode ? (
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <code className="text-sm font-mono text-indigo-800 break-all leading-relaxed">
                      {request.hcsCode}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 bg-white"
                      onClick={() => copyToClipboard(request.hcsCode, "hcsCode")}
                    >
                      {copiedField === "hcsCode" ? (
                        <>
                          <Check className="h-4 w-4 mr-1 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-indigo-600">
                    This is the unique Human Cognitive Signature generated during the access request.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  No HCS code available (classic authentication)
                </p>
              )}
            </div>
          </div>

          {/* Request Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Request Details
            </h3>
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Use Case</div>
                <div className="font-medium">
                  {USE_CASE_LABELS[request.useCase] || request.useCase}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Estimated Volume</div>
                <div className="font-medium">{request.estimatedVolume} req/month</div>
              </div>
              {request.message && (
                <div className="col-span-2">
                  <div className="text-xs text-slate-500 mb-1">Message</div>
                  <div className="text-sm text-slate-700 bg-white rounded p-2 border">
                    {request.message}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Technical Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Technical Information
            </h3>
            <div className="rounded-lg bg-slate-50 p-4 space-y-3">
              <div>
                <div className="text-xs text-slate-500 mb-1">IP Address</div>
                <div className="font-mono text-sm flex items-center gap-2">
                  {request.ipAddress}
                  <CopyButton text={request.ipAddress} field="ipAddress" />
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">User Agent</div>
                <div className="font-mono text-xs text-slate-600 break-all">
                  {request.userAgent}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </h3>
            <div className="rounded-lg bg-slate-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Created</span>
                <span className="font-medium">{formatDate(request.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Last Updated</span>
                <span className="font-medium">{formatDate(request.updatedAt)}</span>
              </div>
              {request.approvedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Approved</span>
                  <span className="font-medium text-green-600">{formatDate(request.approvedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes */}
          {(request.adminNotes || request.rejectedReason) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-900">Admin Notes</h3>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                {request.rejectedReason && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-red-600">Rejection Reason:</span>
                    <p className="text-sm text-slate-700">{request.rejectedReason}</p>
                  </div>
                )}
                {request.adminNotes && (
                  <div>
                    <span className="text-xs font-medium text-amber-600">Notes:</span>
                    <p className="text-sm text-slate-700">{request.adminNotes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

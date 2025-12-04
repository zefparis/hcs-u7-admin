/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

"use client";

import { useState } from "react";
import { XCircle, Building2, Mail, User } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface RejectRequestModalProps {
  request: AccessRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RejectRequestModal({
  request,
  open,
  onOpenChange,
  onSuccess,
}: RejectRequestModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/access-requests/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          reason,
          sendEmail,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reject request");
      }

      toast({
        title: "Request rejected",
        description: sendEmail ? "Notification email sent to prospect" : "Request has been rejected",
        variant: "default",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Reject Access Request
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The prospect will not be able to access the platform.
          </DialogDescription>
        </DialogHeader>

        {/* Request Info */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span className="font-medium">{request.company}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-slate-400" />
            <span>{request.fullName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">{request.email}</span>
          </div>
        </div>

        {/* Rejection Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Rejection *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why this request is being rejected..."
              rows={3}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sendEmail"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="sendEmail" className="text-sm font-normal cursor-pointer">
              Send rejection email to prospect
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Admin Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes about this rejection..."
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
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? "Rejecting..." : "Reject Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

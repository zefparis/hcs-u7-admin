/**
 * Copyright (c) 2025 Benjamin BARRERE / IA SOLUTION
 * Patent Pending FR2514274 | CC BY-NC-SA 4.0
 * Commercial license: contact@ia-solution.fr
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, Eye, Clock, TrendingUp, Users, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApproveRequestModal } from "@/components/admin/ApproveRequestModal";
import { RejectRequestModal } from "@/components/admin/RejectRequestModal";
import { ViewRequestModal } from "@/components/admin/ViewRequestModal";

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

interface Stats {
  pending: number;
  approvedToday: number;
  total: number;
  conversionRate: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const USE_CASE_CONFIG: Record<string, { label: string; variant: "default" | "success" | "secondary" | "warning" }> = {
  banking: { label: "Banking", variant: "default" },
  ecommerce: { label: "E-commerce", variant: "success" },
  api: { label: "API Platform", variant: "secondary" },
  other: { label: "Other", variant: "warning" },
};

const VOLUME_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "warning" | "destructive" }> = {
  "1k-10k": { label: "1k-10k", variant: "secondary" },
  "10k-100k": { label: "10k-100k", variant: "default" },
  "100k-1M": { label: "100k-1M", variant: "warning" },
  "1M+": { label: "1M+", variant: "destructive" },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "warning" | "success" | "destructive" }> = {
  PENDING: { label: "Pending", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

export function AccessRequestsClient() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approvedToday: 0, total: 0, conversionRate: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [useCaseFilter, setUseCaseFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals
  const [approveRequest, setApproveRequest] = useState<AccessRequest | null>(null);
  const [rejectRequest, setRejectRequest] = useState<AccessRequest | null>(null);
  const [viewRequest, setViewRequest] = useState<AccessRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      if (statusFilter) params.set("status", statusFilter);
      if (useCaseFilter) params.set("useCase", useCaseFilter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/admin/access-requests?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setRequests(data.requests);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch access requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, statusFilter, useCaseFilter, searchQuery]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchRequests();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Access Requests</h1>
        <p className="text-slate-600">
          Manage prospect access requests and create new tenant accounts.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-slate-500">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Approved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedToday}</div>
            <p className="text-xs text-slate-500">New tenants created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Requests</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-slate-500">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-slate-500">Approved / Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-600">Filters:</span>
        </div>

        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="w-36"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Select>

        <Select
          value={useCaseFilter}
          onChange={(e) => {
            setUseCaseFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="w-40"
        >
          <option value="">All Use Cases</option>
          <option value="banking">Banking</option>
          <option value="ecommerce">E-commerce</option>
          <option value="api">API Platform</option>
          <option value="other">Other</option>
        </Select>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Search email, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Use Case</th>
              <th className="px-4 py-3">Volume</th>
              <th className="px-4 py-3">HCS Code</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No access requests found.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDate(request.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{request.company}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-900">{request.fullName}</div>
                    <div className="text-xs text-slate-500">{request.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={USE_CASE_CONFIG[request.useCase]?.variant || "secondary"}>
                      {USE_CASE_CONFIG[request.useCase]?.label || request.useCase}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={VOLUME_CONFIG[request.estimatedVolume]?.variant || "secondary"}>
                      {VOLUME_CONFIG[request.estimatedVolume]?.label || request.estimatedVolume}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {request.hcsCode ? (
                      <Badge variant="success">HCS Enabled</Badge>
                    ) : (
                      <Badge variant="warning">Classic Auth</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_CONFIG[request.status]?.variant || "secondary"}>
                      {STATUS_CONFIG[request.status]?.label || request.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {request.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => setApproveRequest(request)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setRejectRequest(request)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        title="View details"
                        onClick={() => setViewRequest(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div>
            Page {pagination.page} / {pagination.totalPages} ({pagination.total} results)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {approveRequest && (
        <ApproveRequestModal
          request={approveRequest}
          open={!!approveRequest}
          onOpenChange={(open) => !open && setApproveRequest(null)}
          onSuccess={() => {
            setApproveRequest(null);
            fetchRequests();
          }}
        />
      )}

      {rejectRequest && (
        <RejectRequestModal
          request={rejectRequest}
          open={!!rejectRequest}
          onOpenChange={(open) => !open && setRejectRequest(null)}
          onSuccess={() => {
            setRejectRequest(null);
            fetchRequests();
          }}
        />
      )}

      {viewRequest && (
        <ViewRequestModal
          request={viewRequest}
          open={!!viewRequest}
          onOpenChange={(open) => !open && setViewRequest(null)}
        />
      )}
    </div>
  );
}

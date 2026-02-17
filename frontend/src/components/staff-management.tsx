"use client";

import { useState, useEffect, useCallback } from "react";
import { listStaff, createStaff, deleteStaff, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Search,
  UserCheck,
  Clock,
  TrendingUp,
  DollarSign,
  Trash2,
} from "lucide-react";
import formatCurrency from "@/lib/format";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";

export function StaffManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  type Staff = {
    id: number;
    username?: string;
    name?: string;
    role?: string;
    department?: string;
    email?: string;
    phone?: string;
    salary?: string;
    status?: string;
    performance?: number;
    workersSupervised?: number;
    avatar?: string;
  };

  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listStaff();
      if (res) {
        const data =
          (res as { data?: Staff[] })?.data || (Array.isArray(res) ? res : []);
        setStaffMembers(data);
      }
    } catch (err) {
      console.error("Failed to load staff", err);
      if (err instanceof ApiError) {
        if (err.isForbidden) {
          setError(
            "You do not have permission to manage staff. Only owners can access this feature.",
          );
        } else if (err.isUnauthorized) {
          setError("Please log in to access staff management.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to load staff members. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ username: "", password: "" });

  // staffMembers state is populated from the backend API

  const filteredStaff = staffMembers.filter((staff) => {
    const matchesSearch = (staff.name || staff.username || staff.email || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // computed stats
  const totalStaff = staffMembers.length;
  const activeStaff = staffMembers.filter(
    (s) => (s.status || "active") === "active",
  ).length;
  const perfValues = staffMembers
    .map((s) => s.performance)
    .filter((p) => typeof p === "number") as number[];
  const avgPerformance = perfValues.length
    ? Math.round(perfValues.reduce((a, b) => a + b, 0) / perfValues.length)
    : 0;
  const parseSalary = (v?: string) => {
    if (!v) return 0;
    const digits = String(v).replace(/[^0-9.]/g, "");
    const n = parseFloat(digits || "0");
    return Number.isFinite(n) ? n : 0;
  };
  const totalPayroll = staffMembers.reduce(
    (s, m) => s + parseSalary(m.salary),
    0,
  );

  if (loading) {
    return <LoadingSpinner fullPage message="Loading staff members..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load staff"
        message={error}
        onRetry={loadStaff}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        eyebrow="People Ops"
        title="Staff Management"
        description="Manage your farm supervisors and staff members"
        actions={
          <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[620px]">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Add a new staff member to your farm team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-4 rounded-xl border border-border/70 bg-background/55 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
                  Step 1
                </p>
                <h3 className="display-heading text-2xl">Account Basics</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newStaff.username}
                      onChange={(e) =>
                        setNewStaff((s) => ({ ...s, username: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newStaff.password}
                      onChange={(e) =>
                        setNewStaff((s) => ({ ...s, password: e.target.value }))
                      }
                      placeholder="Defaults to changeme"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-border/70 bg-background/55 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
                  Step 2
                </p>
                <h3 className="display-heading text-2xl">Role Metadata</h3>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="feed">Feed</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input id="phone" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="salary" className="text-right">
                  Salary
                </Label>
                <Input id="salary" placeholder="₦150,000" className="col-span-3" />
              </div> */}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddStaffOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    await createStaff({
                      username: newStaff.username,
                      password: newStaff.password || "changeme",
                    });
                    setIsAddStaffOpen(false);
                    setNewStaff({ username: "", password: "" });
                    await loadStaff();
                  } catch (err) {
                    console.error("Failed to create staff", err);
                  }
                }}
              >
                Add Staff Member
              </Button>
            </div>
          </DialogContent>
          </Dialog>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Staff
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl leading-none">{totalStaff}</div>
            <p className="text-xs text-muted-foreground">+1 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Active Staff
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl leading-none">{activeStaff}</div>
            <p className="text-xs text-muted-foreground">1 on leave</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Avg Performance
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl leading-none">
              {avgPerformance}%
            </div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Payroll
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl leading-none truncate">
              {formatCurrency(totalPayroll)}
            </div>
            <p className="text-xs text-muted-foreground">Monthly total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        {/* department filter removed - simple create/delete UI for now */}
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle className="display-heading text-2xl">Staff Members</CardTitle>
          <CardDescription>
            Manage your farm staff and their details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStaff.length === 0 ? (
            <EmptyState
              variant="staff"
              title={searchTerm ? "No matching staff" : "No staff members"}
              description={
                searchTerm
                  ? "Try adjusting your search term"
                  : "Add your first staff member to get started"
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={staff.avatar || "/placeholder.svg"}
                            alt={staff.name || staff.username}
                          />
                          <AvatarFallback>
                            {(staff.name || staff.username || "")
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {staff.username || staff.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {staff.role}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (!confirm("Delete this staff member?")) return;
                            try {
                              await deleteStaff(staff.id);
                              await loadStaff();
                            } catch (err) {
                              console.error("Failed to delete staff", err);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

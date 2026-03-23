"use client";

import { useMemo, useState } from "react";
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
import {
  useResourcePermissions,
  useStaffMembers,
  useToastContext,
} from "@/hooks";
import {
  buildCreateStaffPayload,
  buildStaffSummary,
  createEmptyStaffForm,
  filterStaffMembers,
  getStaffDisplayName,
  getStaffInitials,
} from "@/lib/staffManagement";

export function StaffManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaff, setNewStaff] = useState(createEmptyStaffForm());
  const {
    staffMembers,
    loading,
    error,
    refresh,
    create,
    remove,
    isMutating,
  } = useStaffMembers();
  const { canCreate, canDelete } = useResourcePermissions("STAFF");
  const toast = useToastContext();

  const filteredStaff = useMemo(
    () => filterStaffMembers(staffMembers, searchTerm),
    [searchTerm, staffMembers],
  );
  const summary = useMemo(() => buildStaffSummary(staffMembers), [staffMembers]);

  const handleCreate = async () => {
    if (!newStaff.username.trim()) {
      toast.error("Username is required");
      return;
    }

    try {
      await create(buildCreateStaffPayload(newStaff));
      setIsAddStaffOpen(false);
      setNewStaff(createEmptyStaffForm());
      toast.success("Staff member added");
    } catch (creationError) {
      console.error("Failed to create staff", creationError);
      toast.error("Failed to create staff member");
    }
  };

  const handleDelete = async (staffId: number) => {
    if (!confirm("Delete this staff member?")) {
      return;
    }

    try {
      await remove(staffId);
      toast.success("Staff member deleted");
    } catch (deletionError) {
      console.error("Failed to delete staff", deletionError);
      toast.error("Failed to delete staff member");
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading staff members..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load staff"
        message={error.message}
        onRetry={() => {
          void refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="People Ops"
        title="Staff Management"
        description="Manage your farm supervisors and staff members"
        actions={
          canCreate ? (
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
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={newStaff.username}
                          onChange={(event) =>
                            setNewStaff((current) => ({
                              ...current,
                              username: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newStaff.password}
                          onChange={(event) =>
                            setNewStaff((current) => ({
                              ...current,
                              password: event.target.value,
                            }))
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
                        <SelectTrigger id="department">
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
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddStaffOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button disabled={isMutating} onClick={handleCreate}>
                    Add Staff Member
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Staff
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="display-heading text-3xl leading-none">
              {summary.totalStaff}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.activeStaff} active member
              {summary.activeStaff !== 1 ? "s" : ""}
            </p>
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
            <div className="display-heading text-3xl leading-none">
              {summary.activeStaff}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.inactiveStaff} inactive member
              {summary.inactiveStaff !== 1 ? "s" : ""}
            </p>
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
              {summary.avgPerformance}%
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.performanceRecordCount > 0
                ? `Based on ${summary.performanceRecordCount} performance record${summary.performanceRecordCount !== 1 ? "s" : ""}`
                : "No performance records yet"}
            </p>
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
              {formatCurrency(summary.totalPayroll)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.payrollRecords} salary record
              {summary.payrollRecords !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff members..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-8"
          />
        </div>
      </div>

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
                            alt={getStaffDisplayName(staff)}
                          />
                          <AvatarFallback>
                            {getStaffInitials(staff)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {getStaffDisplayName(staff)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {staff.role}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isMutating}
                            onClick={() => {
                              void handleDelete(staff.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                          </Button>
                        )}
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

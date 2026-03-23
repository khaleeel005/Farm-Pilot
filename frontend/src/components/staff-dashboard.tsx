"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, Egg, Package, TrendingUp, Target } from "lucide-react"
import { useUser } from "@/context/UserContext"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { useStaffDashboardOverview } from "@/hooks"

interface StaffDashboardProps {
  onNavigate?: (tab: string) => void;
}

export function StaffDashboard({ onNavigate }: StaffDashboardProps) {
  const { user } = useUser()
  const { data, isPending, error, refetch } = useStaffDashboardOverview()
  const todaysTasks = data?.todaysTasks ?? []
  const stats = data?.stats ?? {
    eggsCollected: 0,
    feedBagsUsed: 0,
    tasksCompleted: 0,
    totalTasks: 0,
  }
  
  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  if (isPending) {
    return <LoadingSpinner fullPage message="Loading dashboard..." />
  }

  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={() => {
          void refetch()
        }}
      />
    )
  }

  const taskProgress = stats.totalTasks > 0 ? (stats.tasksCompleted / stats.totalTasks) * 100 : 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Staff Console"
        title={`${getGreeting()}, ${user?.username || 'Staff'}!`}
        description="Here's your daily overview and tasks"
        actions={
          <Badge variant="outline" className="text-sm">
            {new Date().toLocaleDateString()}
          </Badge>
        }
      />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eggs Collected Today</CardTitle>
            <Egg className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eggsCollected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              {stats.eggsCollected > 0 ? 'Keep up the good work!' : 'Start logging today'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feed Used</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.feedBagsUsed} bags</div>
            <p className="text-xs text-muted-foreground">Today&apos;s distribution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Today</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasksCompleted}/{stats.totalTasks}</div>
            <Progress value={taskProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(taskProgress)}%</div>
            <p className="text-xs text-muted-foreground">
              {taskProgress === 100 ? 'All done!' : 'Keep going!'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Tasks</CardTitle>
          <CardDescription>Your assigned tasks for today</CardDescription>
        </CardHeader>
        <CardContent>
          {todaysTasks.length > 0 ? (
            <div className="space-y-4">
              {todaysTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {task.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : task.status === "in-progress" ? (
                      <Clock className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-orange-500" />
                    )}
                    <div>
                      <p
                        className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                      >
                        {task.task}
                      </p>
                      <p className="text-sm text-muted-foreground">{task.time}</p>
                    </div>
                  </div>
                  <Badge variant={
                    task.status === "completed" ? "default" : 
                    task.status === "in-progress" ? "secondary" : "outline"
                  }>
                    {task.status === "completed" ? "Done" : 
                     task.status === "in-progress" ? "In Progress" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              variant="logs"
              title="No tasks assigned"
              description="You don't have any tasks assigned for today."
            />
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Navigate to common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 bg-transparent"
              onClick={() => onNavigate?.('daily-entry')}
            >
              <Egg className="h-5 w-5 mr-2" />
              <div className="text-left">
                <div className="font-medium">Log Egg Collection</div>
                <div className="text-sm text-muted-foreground">Record today&apos;s harvest and feed usage</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 bg-transparent"
              onClick={() => onNavigate?.('expenses')}
            >
              <Package className="h-5 w-5 mr-2" />
              <div className="text-left">
                <div className="font-medium">Record Expense</div>
                <div className="text-sm text-muted-foreground">Log farm-related expenses</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

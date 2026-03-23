"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, TrendingUp, Egg, Package, Clock, Award, Target, BarChart3 } from "lucide-react"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { PageHeader } from "@/components/shared/page-header"
import { useStaffPerformance } from "@/hooks"

export function StaffReports() {
  const { data, isPending, error, refetch } = useStaffPerformance()
  const weeklyStats = data?.weeklyStats ?? {
    eggsCollected: 0,
    feedDistributed: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    avgCollectionTime: "-",
    efficiency: 0,
  }
  const dailyPerformance = data?.dailyPerformance ?? []

  if (isPending) {
    return <LoadingSpinner fullPage message="Loading performance data..." />
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

  const hasData = weeklyStats.eggsCollected > 0 || weeklyStats.tasksCompleted > 0

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Productivity"
        title="My Performance"
        description="Your work summary, output trends, and weekly achievements"
        actions={
          <Badge variant="outline" className="text-sm">
            <Calendar className="h-4 w-4 mr-1" />
            This Week
          </Badge>
        }
      />

      {/* Weekly Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eggs Collected</CardTitle>
            <Egg className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyStats.eggsCollected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              This week&apos;s total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feed Distributed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyStats.feedDistributed}kg</div>
            <p className="text-xs text-muted-foreground">This week&apos;s distribution</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyStats.tasksCompleted}/{weeklyStats.totalTasks}
            </div>
            <Progress 
              value={weeklyStats.totalTasks > 0 ? (weeklyStats.tasksCompleted / weeklyStats.totalTasks) * 100 : 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{weeklyStats.efficiency}%</div>
            <p className="text-xs text-muted-foreground">
              <Clock className="inline h-3 w-3 mr-1" />
              Avg: {weeklyStats.avgCollectionTime}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Daily Performance This Week
          </CardTitle>
          <CardDescription>Your daily work summary and efficiency metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <div className="space-y-4">
              {dailyPerformance.map((day, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{day.day}</h4>
                      <p className="text-xs text-muted-foreground">{new Date(day.date).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={day.efficiency >= 95 ? "default" : day.efficiency >= 90 ? "secondary" : "outline"}>
                      {day.efficiency}% Efficiency
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Egg className="h-4 w-4 text-muted-foreground" />
                      <span>{day.eggs.toLocaleString()} eggs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{day.feed}kg feed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>{day.tasks}/{day.totalTasks} tasks</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              variant="reports"
              title="No performance data yet"
              description="Start logging your daily activities to see your performance metrics."
            />
          )}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Achievements
          </CardTitle>
          <CardDescription>Your accomplishments and milestones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyStats.tasksCompleted >= weeklyStats.totalTasks && weeklyStats.totalTasks > 0 && (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Perfect Week</p>
                  <p className="text-sm text-muted-foreground">Completed all assigned tasks this week</p>
                </div>
              </div>
            )}

            {weeklyStats.efficiency >= 90 && (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Efficiency Champion</p>
                  <p className="text-sm text-muted-foreground">Maintained 90%+ efficiency this week</p>
                </div>
              </div>
            )}

            {weeklyStats.eggsCollected >= 5000 && (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Egg className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Collection Expert</p>
                  <p className="text-sm text-muted-foreground">Collected 5,000+ eggs this week</p>
                </div>
              </div>
            )}

            {!hasData && (
              <EmptyState
                variant="reports"
                title="No achievements yet"
                description="Complete tasks and log your work to earn achievements."
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

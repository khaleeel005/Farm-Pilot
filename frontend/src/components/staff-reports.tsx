"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, TrendingUp, Egg, Package, Clock, Award, Target, BarChart3 } from "lucide-react"
import { getDailyLogs, getWorkAssignments } from "@/lib/api"
import { LoadingSpinner } from "@/components/shared/loading-spinner"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"

interface DailyPerformance {
  day: string;
  date: string;
  eggs: number;
  feed: number;
  tasks: number;
  totalTasks: number;
  efficiency: number;
}

interface WeeklyStats {
  eggsCollected: number;
  feedDistributed: number;
  tasksCompleted: number;
  totalTasks: number;
  avgCollectionTime: string;
  efficiency: number;
}

export function StaffReports() {
  const [loading, setLoading] = useState(true)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    eggsCollected: 0,
    feedDistributed: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    avgCollectionTime: "-",
    efficiency: 0,
  })
  const [dailyPerformance, setDailyPerformance] = useState<DailyPerformance[]>([])

  useEffect(() => {
    async function loadPerformanceData() {
      setLoading(true)
      try {
        // Get dates for this week (Monday to Sunday)
        const today = new Date()
        const dayOfWeek = today.getDay()
        const monday = new Date(today)
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)

        const startDate = monday.toISOString().split('T')[0]
        const endDate = sunday.toISOString().split('T')[0]

        // Fetch daily logs for this week
        const logs = await getDailyLogs({ startDate, endDate }).catch(() => [])
        
        // Fetch work assignments for this week
        const assignments = await getWorkAssignments().catch(() => [])

        // Group logs by day
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const dailyData: Map<string, { eggs: number; feed: number; date: string }> = new Map()
        
        // Initialize all days of the week
        for (let i = 0; i < 7; i++) {
          const date = new Date(monday)
          date.setDate(monday.getDate() + i)
          const dateStr = date.toISOString().split('T')[0]
          dailyData.set(dateStr, { eggs: 0, feed: 0, date: dateStr })
        }

        // Aggregate logs by date
        logs.forEach(log => {
          const logDate = log.logDate
          const existing = dailyData.get(logDate)
          if (existing) {
            existing.eggs += Number(log.eggsCollected) || 0
            existing.feed += (Number(log.feedBagsUsed) || 0) * 25 // 25kg per bag
          }
        })

        // Calculate tasks per day
        const tasksByDay: Map<string, { completed: number; total: number }> = new Map()
        for (let i = 0; i < 7; i++) {
          const date = new Date(monday)
          date.setDate(monday.getDate() + i)
          const dateStr = date.toISOString().split('T')[0]
          tasksByDay.set(dateStr, { completed: 0, total: 4 }) // Assume 4 tasks per day
        }

        assignments.forEach(a => {
          const assignmentDate = (a.date || a.createdAt || '').split('T')[0]
          const existing = tasksByDay.get(assignmentDate)
          if (existing) {
            existing.total++
            if (a.attendanceStatus === 'present') {
              existing.completed++
            }
          }
        })

        // Build daily performance array
        const performance: DailyPerformance[] = []
        dailyData.forEach((data, dateStr) => {
          const date = new Date(dateStr)
          const dayName = dayNames[date.getDay()]
          const tasks = tasksByDay.get(dateStr) || { completed: 0, total: 4 }
          
          // Calculate efficiency based on task completion and production
          const taskEfficiency = tasks.total > 0 ? (tasks.completed / tasks.total) * 100 : 0
          
          performance.push({
            day: dayName,
            date: dateStr,
            eggs: data.eggs,
            feed: data.feed,
            tasks: tasks.completed,
            totalTasks: tasks.total,
            efficiency: Math.round(taskEfficiency),
          })
        })

        // Sort by date (Monday first)
        performance.sort((a, b) => {
          const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          return order.indexOf(a.day) - order.indexOf(b.day)
        })

        setDailyPerformance(performance)

        // Calculate weekly totals
        const totalEggs = performance.reduce((sum, d) => sum + d.eggs, 0)
        const totalFeed = performance.reduce((sum, d) => sum + d.feed, 0)
        const totalTasksCompleted = performance.reduce((sum, d) => sum + d.tasks, 0)
        const totalTasksAll = performance.reduce((sum, d) => sum + d.totalTasks, 0)
        const avgEfficiency = performance.length > 0
          ? Math.round(performance.reduce((sum, d) => sum + d.efficiency, 0) / performance.length)
          : 0

        setWeeklyStats({
          eggsCollected: totalEggs,
          feedDistributed: totalFeed,
          tasksCompleted: totalTasksCompleted,
          totalTasks: totalTasksAll,
          avgCollectionTime: totalEggs > 0 ? "~45 min" : "-",
          efficiency: avgEfficiency,
        })

      } catch (err) {
        console.error('Failed to load performance data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPerformanceData()
  }, [])

  if (loading) {
    return <LoadingSpinner fullPage message="Loading performance data..." />
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

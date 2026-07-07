import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Flame, CheckCircle2, Clock, PlayCircle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-st-text-primary">Welcome back, Developer</h1>
          <p className="text-st-text-secondary mt-1">Ready for today's deep work session?</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-st-bg-elevated rounded-lg border border-st-border">
          <Flame className="w-5 h-5 text-st-accent" />
          <span className="font-semibold text-st-text-primary">14 Day Streak</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <p className="text-sm font-medium text-st-text-secondary mb-1">Study Hours</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold">24.5</h3>
            <span className="text-sm text-st-success">+2.1h this week</span>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-st-text-secondary mb-1">Tasks Completed</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold">12</h3>
            <span className="text-sm text-st-success">On track</span>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-st-text-secondary mb-1">Current Focus</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold">System Design</h3>
          </div>
        </Card>
        <Card className="p-5 bg-st-accent/10 border-st-accent/20">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium text-st-accent">Pomodoro</p>
            <PlayCircle className="w-4 h-4 text-st-accent" />
          </div>
          <h3 className="text-2xl font-bold text-st-text-primary">25:00</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Plan */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Today's Plan</h2>
          
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-st-border">
              <div className="p-5 flex gap-4 items-start hover:bg-st-bg-elevated transition-colors cursor-pointer">
                <div className="mt-1">
                  <CheckCircle2 className="w-5 h-5 text-st-text-muted" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-st-text-primary">Review Kafka Partitioning Logic</h4>
                    <Badge variant="warning">Critical</Badge>
                  </div>
                  <p className="text-sm text-st-text-secondary mb-3">Memory consolidation phase. Review the whitepaper and notes.</p>
                  <div className="flex items-center gap-4 text-xs text-st-text-muted">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 45 mins</span>
                    <span>System Design</span>
                  </div>
                </div>
              </div>
              
              <div className="p-5 flex gap-4 items-start hover:bg-st-bg-elevated transition-colors cursor-pointer">
                <div className="mt-1">
                  <CheckCircle2 className="w-5 h-5 text-st-text-muted" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-st-text-primary">Complete Dynamic Programming Quiz</h4>
                    <Badge variant="outline">Medium</Badge>
                  </div>
                  <p className="text-sm text-st-text-secondary mb-3">Knapsack and LCS variations.</p>
                  <div className="flex items-center gap-4 text-xs text-st-text-muted">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 30 mins</span>
                    <span>Algorithms</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-st-bg-elevated border-t border-st-border">
              <Button variant="ghost" className="w-full text-sm">View All Tasks</Button>
            </div>
          </Card>
        </div>

        {/* AI Recommendations & Activity */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">AI Recommendations</h2>
            <Card className="p-5">
              <p className="text-sm text-st-text-secondary mb-4">
                Based on your recent performance in System Design, I recommend reviewing <strong>Consistency Models</strong> before your mock interview on Friday.
              </p>
              <Button variant="outline" className="w-full text-sm">Add to Schedule</Button>
            </Card>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-st-success shrink-0"></div>
                <div>
                  <p className="text-sm font-medium">Completed Docker Multi-stage Builds</p>
                  <p className="text-xs text-st-text-muted">2 hours ago</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-st-accent shrink-0"></div>
                <div>
                  <p className="text-sm font-medium">Uploaded 'Designing Data-Intensive Applications'</p>
                  <p className="text-xs text-st-text-muted">Yesterday</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

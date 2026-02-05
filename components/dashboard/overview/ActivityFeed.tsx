import React from "react";
import { AgentActivity } from "@/lib/types";

type ActivityFeedProps = {
  activities: AgentActivity[];
};

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border bg-surface-muted/50 px-6 py-4 backdrop-blur-sm">
        <h3 className="font-semibold text-text">Live Activity Feed</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {activities.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted">
             <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="relative space-y-6 pl-4 before:absolute before:bottom-0 before:left-[19px] before:top-2 before:w-px before:bg-border/50">
            {activities.map((activity) => (
              <div key={activity.id} className="relative flex gap-4">
                {/* Timeline Dot */}
                <div
                  className={`relative z-10 grid h-2.5 w-2.5 shrink-0 place-items-center rounded-full ring-4 ring-surface mt-1.5 
                    ${activity.type === 'error' ? 'bg-rose-500' : activity.type === 'system' ? 'bg-blue-500' : 'bg-emerald-500'}
                  `}
                />
                
                <div className="flex flex-col gap-1">
                   <p className="text-sm font-medium text-text">{activity.message}</p>
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted bg-surface-muted px-1.5 rounded-sm">
                        {activity.type}
                      </span>
                      <time className="text-xs text-muted">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </time>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

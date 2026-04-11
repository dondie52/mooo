"use client";

import { cn } from "@/lib/utils";

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
}

export default function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-border overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative",
            activeTab === tab.key
              ? "text-forest-deep"
              : "text-muted hover:text-forest-mid"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              "ml-1.5 text-[10px] font-bold rounded-full px-1.5 py-0.5",
              activeTab === tab.key
                ? "bg-forest-mid text-white"
                : "bg-earth-sand text-muted"
            )}>
              {tab.count}
            </span>
          )}
          {activeTab === tab.key && (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}

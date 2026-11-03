import { NavLink } from "react-router";
import { cn } from "@/lib/utils";

export interface TabItem {
  to: string;
  label: string;
  end?: boolean;
  badge?: number;
}

/** Route-backed tabs: each tab is a link, so tabs are bookmarkable. */
export function TabNav({ items, label }: { items: TabItem[]; label: string }) {
  return (
    <nav aria-label={label} className="flex gap-1 overflow-x-auto border-b border-border">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "-mb-px whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground",
              isActive && "border-primary font-medium text-foreground",
            )
          }
        >
          {item.label}
          {item.badge ? (
            <span className="ml-1.5 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{item.badge}</span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );
}

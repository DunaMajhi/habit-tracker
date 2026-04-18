import Link from "next/link";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/transactions", label: "Transactions" },
  { href: "/insights", label: "Insights" },
  { href: "/settings", label: "Settings" },
];

export function DashboardNav() {
  return (
    <nav className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-900 hover:text-white"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
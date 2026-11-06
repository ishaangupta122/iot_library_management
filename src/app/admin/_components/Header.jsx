"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { findNavItem } from "@/lib/navigation";
import { GlobalSearch } from "@/app/admin/_components/GlobalSearch";
import { NotificationsMenu } from "@/app/admin/_components/HeaderMenus";
import { useLibrary } from "@/context/LibraryContext";

export function Header({ onOpenMenu }) {
  const page = findNavItem(usePathname());
  const { feedStatus } = useLibrary();
  const TAG = { loading: ["Loading", "bg-muted"], offline: ["Offline", "bg-brand-600"], error: ["Error", "bg-brand-600"] }[feedStatus];
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface px-4 text-ink sm:px-6 print:hidden">
      <button type="button" onClick={onOpenMenu} aria-label="Open navigation" className="rounded-lg border border-line-strong p-2.5 text-ink-soft hover:bg-cream-100 lg:hidden">
        <Menu size={18} aria-hidden="true" />
      </button>
      <nav aria-label="Breadcrumb" className="hidden min-w-0 text-sm md:block">
        <ol className="flex items-center gap-2 whitespace-nowrap">
          <li className="text-muted">Admin</li>
          <li aria-hidden="true" className="text-line-strong">/</li>
          <li aria-current="page" className="font-semibold text-ink">{page.label}</li>
        </ol>
      </nav>
      {TAG && (
        <span className="hidden items-center gap-2 rounded-full border border-line-strong bg-cream-100 px-3 py-1 text-xs font-medium text-ink-soft md:inline-flex">
          <span className={`h-2 w-2 rounded-full ${TAG[1]}`} aria-hidden="true" />{TAG[0]}
        </span>
      )}
      <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-3 sm:flex-none">
        <div className="min-w-0 flex-1 sm:w-[26rem] sm:flex-none lg:w-[34rem]"><GlobalSearch /></div>
        <NotificationsMenu />
      </div>
    </header>
  );
}

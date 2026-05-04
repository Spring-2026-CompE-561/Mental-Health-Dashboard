"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "./Logo";
import { useAuth } from "@/contexts/AuthContext";

interface NavLink {
  label: string;
  href: string;
}

interface AppHeaderProps {
  title?: string;
  links?: NavLink[];
}

const NAV_LINKS: NavLink[] = [
  { label: "Journals", href: "/journals" },
  { label: "Questionnaire", href: "/questionnaire" },
  { label: "Settings", href: "/settings" },
];

export default function AppHeader({ title = "Mental Health Dashboard", links = [] }: AppHeaderProps) {
  const { isAuthenticated, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  const navLinks = isAuthenticated ? NAV_LINKS : links;

  return (
    <header
      className="flex w-full items-center justify-between px-6 py-6 md:px-[80px] md:py-[32px] shrink-0"
      style={{
        borderBottom: "1px solid var(--border-light)",
        backgroundColor: "var(--card-bg)",
        transition: "background-color 0.3s ease, border-color 0.3s ease",
      }}
    >
      <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-3 md:gap-4 no-underline">
        <Logo size={36} stroke="#555" />
        <span
          className="font-semibold text-[18px] md:text-[22px] tracking-tight"
          style={{ color: "var(--body-color)" }}
        >
          {title}
        </span>
      </Link>

      <nav className="flex items-center gap-4 md:gap-[36px]">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-[16px] md:text-[18px] transition-colors no-underline"
              style={{
                color: isActive ? "var(--heading-color)" : "var(--secondary-color)",
                fontWeight: isActive ? 700 : 500,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--heading-color)")}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = "var(--secondary-color)";
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

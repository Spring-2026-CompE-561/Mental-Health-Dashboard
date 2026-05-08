"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "./Logo";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

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
  const { isDark, toggleTheme } = useTheme();
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

        {isAuthenticated && (
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="ml-2 w-[40px] h-[40px] rounded-full border-none cursor-pointer flex items-center justify-center transition-all hover:opacity-80"
            style={{ backgroundColor: "var(--border-color)" }}
          >
            {isDark ? (
              // Sun (currently dark, click goes to light)
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="4" fill="var(--heading-color)" />
                <path
                  d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                  stroke="var(--heading-color)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              // Moon (currently light, click goes to dark)
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"
                  fill="var(--heading-color)"
                  stroke="var(--heading-color)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        )}
      </nav>
    </header>
  );
}

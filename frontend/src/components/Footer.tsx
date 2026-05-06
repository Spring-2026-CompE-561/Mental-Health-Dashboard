export default function Footer() {
  return (
    <footer
      className="w-full shrink-0 px-6 py-4 text-center"
      style={{
        borderTop: "1px solid var(--border-light)",
        backgroundColor: "var(--card-bg)",
        transition: "background-color 0.3s ease, border-color 0.3s ease",
      }}
    >
      <p
        className="text-sm"
        style={{ color: "var(--body-color)" }}
      >
        © {new Date().getFullYear()} Mental Health Dashboard
      </p>

      <p
        className="mt-1 text-xs"
        style={{ color: "var(--secondary-color)" }}
      >
        Your data is private and secure
      </p>
    </footer>
  );
}
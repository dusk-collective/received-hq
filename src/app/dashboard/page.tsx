export default function DashboardPage() {
  const stats = [
    { label: "Packages Today", value: "0", icon: "📦" },
    { label: "Awaiting Pickup", value: "0", icon: "⏳" },
    { label: "Delivered", value: "0", icon: "✅" },
    { label: "Total This Month", value: "0", icon: "📊" },
  ];

  const columns = [
    "Tracking #",
    "Recipient",
    "Carrier",
    "Status",
    "Received At",
    "Storage Location",
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/5 bg-surface p-6"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm text-white/40">{stat.label}</span>
              <span className="text-lg">{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Packages Table */}
      <div className="rounded-2xl border border-white/5 bg-surface">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-sm font-semibold text-white">Recent Packages</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/30"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <svg
                      className="mb-4 h-12 w-12 text-white/10"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                      />
                    </svg>
                    <p className="mb-1 text-sm font-medium text-white/40">
                      No packages logged yet
                    </p>
                    <p className="text-xs text-white/25">
                      Scan your first package to get started.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

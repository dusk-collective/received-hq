export default function ScanPage() {
  return (
    <div className="mx-auto max-w-2xl">
      {/* Camera Section */}
      <div className="mb-8 flex flex-col items-center rounded-2xl border border-dashed border-white/10 bg-surface p-12 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-purple/10">
          <svg
            className="h-10 w-10 text-purple"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">
          Scan a Package Label
        </h2>
        <p className="mb-6 text-sm text-white/40">
          Take a photo of the shipping label and AI will extract the details
          automatically.
        </p>
        <button className="inline-flex h-11 items-center gap-2 rounded-lg bg-purple px-6 text-sm font-medium text-white transition-colors hover:bg-purple-hover">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
            />
          </svg>
          Open Camera
        </button>
      </div>

      {/* Manual Entry */}
      <div className="rounded-2xl border border-white/5 bg-surface p-8">
        <h3 className="mb-6 text-base font-semibold text-white">
          Manual Entry
        </h3>
        <form className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="tracking"
                className="mb-1.5 block text-sm font-medium text-white/70"
              >
                Tracking Number
              </label>
              <input
                id="tracking"
                type="text"
                placeholder="1Z999AA10123456784"
                className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-purple"
              />
            </div>
            <div>
              <label
                htmlFor="recipient"
                className="mb-1.5 block text-sm font-medium text-white/70"
              >
                Recipient
              </label>
              <input
                id="recipient"
                type="text"
                placeholder="Guest name or room number"
                className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-purple"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="carrier"
                className="mb-1.5 block text-sm font-medium text-white/70"
              >
                Carrier
              </label>
              <select
                id="carrier"
                className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-colors focus:border-purple appearance-none"
              >
                <option value="" className="bg-[#141414]">Select carrier</option>
                <option value="ups" className="bg-[#141414]">UPS</option>
                <option value="fedex" className="bg-[#141414]">FedEx</option>
                <option value="usps" className="bg-[#141414]">USPS</option>
                <option value="amazon" className="bg-[#141414]">Amazon</option>
                <option value="dhl" className="bg-[#141414]">DHL</option>
                <option value="other" className="bg-[#141414]">Other</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="location"
                className="mb-1.5 block text-sm font-medium text-white/70"
              >
                Storage Location
              </label>
              <input
                id="location"
                type="text"
                placeholder="Shelf A3, Back office, etc."
                className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-purple"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="notes"
              className="mb-1.5 block text-sm font-medium text-white/70"
            >
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Fragile, oversized, multiple boxes..."
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-purple resize-none"
            />
          </div>

          <button
            type="submit"
            className="h-11 w-full rounded-lg bg-purple text-sm font-medium text-white transition-colors hover:bg-purple-hover"
          >
            Log Package
          </button>
        </form>
      </div>
    </div>
  );
}

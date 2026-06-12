export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Services & Pricing</h1>
          <p className="text-zinc-400 mt-1">Explore all available modules.</p>
        </div>
        <div className="w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Search services..." 
            className="w-full sm:w-64 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-500 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4 w-16">ID</th>
                <th className="px-6 py-4">Service Name</th>
                <th className="px-6 py-4 whitespace-nowrap">Rate per 1k</th>
                <th className="px-6 py-4 whitespace-nowrap">Min / Max</th>
                <th className="px-6 py-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              <tr className="bg-orange-500/5">
                <td colSpan={5} className="px-6 py-3 font-bold text-orange-500 uppercase text-xs tracking-wider">
                  ⭐ Instagram Followers
                </td>
              </tr>
              <tr className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-zinc-500">1021</td>
                <td className="px-6 py-4 font-medium text-white">Instagram Followers | HQ | 30 Days Refill</td>
                <td className="px-6 py-4 font-bold text-orange-400">$1.50</td>
                <td className="px-6 py-4 text-zinc-400">10 / 50000</td>
                <td className="px-6 py-4 text-center">
                  <button className="text-zinc-500 hover:text-orange-500 transition-colors">
                    <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-zinc-500">1022</td>
                <td className="px-6 py-4 font-medium text-white">Instagram Followers | Real | Non-Drop</td>
                <td className="px-6 py-4 font-bold text-orange-400">$2.80</td>
                <td className="px-6 py-4 text-zinc-400">50 / 100000</td>
                <td className="px-6 py-4 text-center">
                  <button className="text-zinc-500 hover:text-orange-500 transition-colors">
                    <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
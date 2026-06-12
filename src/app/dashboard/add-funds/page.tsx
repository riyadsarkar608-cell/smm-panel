export default function AddFundsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Add Funds</h1>
        <p className="text-zinc-400 mt-1">Top up your balance instantly.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 lg:p-8 relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <form className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="cursor-pointer">
                <input type="radio" name="method" className="peer sr-only" defaultChecked />
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 peer-checked:border-orange-500 peer-checked:ring-1 peer-checked:ring-orange-500 transition-all text-center">
                  <span className="block font-bold text-white">Crypto</span>
                  <span className="text-xs text-zinc-500 mt-1">BTC, ETH, USDT</span>
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="method" className="peer sr-only" />
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 peer-checked:border-orange-500 peer-checked:ring-1 peer-checked:ring-orange-500 transition-all text-center">
                  <span className="block font-bold text-white">Card</span>
                  <span className="text-xs text-zinc-500 mt-1">Stripe / Visa</span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Amount (USD)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-orange-500 font-bold text-lg">$</span>
              </div>
              <input 
                type="number" 
                placeholder="10.00" 
                min="10"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-4 text-white text-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-bold"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">Minimum deposit amount: $10.00</p>
          </div>

          <button type="button" className="w-full py-4 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition-colors shadow-lg text-lg">
            Pay Now
          </button>
        </form>
      </div>
      
      <div className="text-center text-sm text-zinc-500">
        By clicking "Pay Now", you agree to our Terms of Service & Refund Policy.
      </div>
    </div>
  );
}
const TabNavigation = ({ activeTab, setActiveTab }) => (
  <div className="mt-4 sm:mt-6 flex space-x-2 sm:space-x-4 border-b border-slate-700/50 pb-2 overflow-x-auto">
    {["preferences", "manage", "app"].map((tab) => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`px-3 sm:px-4 py-2 rounded-md transition-colors whitespace-nowrap text-sm sm:text-base ${
          activeTab === tab
            ? "border-b-2 border-indigo-400 text-white font-medium"
            : "text-slate-400 hover:text-slate-300"
        }`}
      >
        {tab.charAt(0).toUpperCase() + tab.slice(1)}
      </button>
    ))}
  </div>
);

export default TabNavigation;

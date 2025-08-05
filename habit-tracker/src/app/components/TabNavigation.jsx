const TabNavigation = ({ activeTab, setActiveTab }) => (
  <div className="mt-6 flex space-x-4 border-b border-gray-600 pb-2">
    {["preferences", "manage", "App"].map((tab) => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 rounded-md ${
          activeTab === tab
            ? "border-b-2 border-purple-400 text-white"
            : "text-gray-400"
        }`}
      >
        {tab.charAt(0).toUpperCase() + tab.slice(1)}
      </button>
    ))}
  </div>
);

export default TabNavigation;

const LogoutButton = ({ logout }) => (
  <button
    onClick={logout}
    className="mt-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
  >
    Logout
  </button>
);

export default LogoutButton;

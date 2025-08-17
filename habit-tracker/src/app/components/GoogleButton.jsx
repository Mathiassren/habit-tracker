"use client";

export default function GoogleButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 border border-gray-600 text-white py-2 px-6 rounded-lg shadow-lg transition-transform duration-300 transform hover:scale-105 hover:bg-gray-800"
      aria-label={label}
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 533.5 544.3"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          fill="#4285F4"
          d="M533.5 278.4c0-17.4-1.6-34-4.6-50.2H272v95.1h146.9c-6.4 34.3-25.4 63.4-54.2 82.9l87.6 68c51.1-47.1 81.2-116.4 81.2-195.8z"
        />
        <path
          fill="#34A853"
          d="M272 544.3c73.5 0 135-24.3 180-66l-87.6-68c-24.4 16.4-55.5 26-92.4 26-71.1 0-131.3-48-152.8-112.4l-90.5 69.9c43.9 87.5 135.3 150.5 243.3 150.5z"
        />
        <path
          fill="#FBBC05"
          d="M119.2 323.9c-10.2-30.5-10.2-63.5 0-94l-90.5-69.9C-21.8 212.7-21.8 331.6 28.7 415.8l90.5-69.9z"
        />
        <path
          fill="#EA4335"
          d="M272 107.7c39.9 0 75.8 13.7 104.1 40.8l77.8-77.8C407 24.2 345.5 0 272 0 164 0 72.6 63 28.7 152.1l90.5 69.9C140.7 155.7 200.9 107.7 272 107.7z"
        />
      </svg>
      {label}
    </button>
  );
}

import { Link } from "react-router-dom";

export default function SignInDropdown() {
  return (
    <div className="absolute right-0 top-full pt-3 z-50">
      {/* Invisible bridge covers the gap so hover doesn't break */}
      <div className="w-80 bg-white shadow-xl rounded-xl p-5 relative">

        {/* Arrow */}
        <div className="absolute -top-2 right-6 w-4 h-4 bg-white rotate-45 shadow-sm" />

        <p className="text-sm text-gray-700 mb-4">
          Save your designs, easily track your orders, and get access to exclusive
          member benefits.
        </p>

        <Link
          to="/login"
          className="block text-center bg-brand text-white font-medium py-2 rounded-lg mb-4 hover:bg-brand-500"
        >
          Sign in
        </Link>

        <div className="border-t pt-3 flex items-center gap-2 text-sm text-gray-700 hover:text-brand cursor-pointer">
          📦 <span>Find and track an order</span>
        </div>
      </div>
    </div>
  );
}

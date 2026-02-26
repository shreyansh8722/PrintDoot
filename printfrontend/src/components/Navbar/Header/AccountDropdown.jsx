import { Link } from "react-router-dom";

export default function AccountDropdown({ onLogout }) {
    return (
        <div className="absolute right-0 top-full mt-3 w-60 bg-white shadow-xl rounded-xl p-2 z-50 border border-gray-100">

            {/* Arrow */}
            <div className="absolute -top-2 right-6 w-4 h-4 bg-white rotate-45 shadow-sm border-l border-t border-gray-100" />

            <div className="flex flex-col">
                <Link
                    to="/account"
                    className="px-4 py-2 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                    My Account
                </Link>
                <Link
                    to="/account/orders"
                    className="px-4 py-2 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                    My Orders
                </Link>
                <Link
                    to="/account/designs"
                    className="px-4 py-2 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                    My Projects
                </Link>

                <div className="h-px bg-gray-100 my-1"></div>

                <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 rounded-lg text-sm font-medium transition-colors"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}

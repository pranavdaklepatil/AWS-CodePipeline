import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSocket } from "../contexts/SocketContext";
import { Wifi, WifiOff, Menu, X, User, LogOut, Settings, LayoutDashboard, Users, CreditCard, Hospital } from "lucide-react";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, isAuthenticated, isStaff, logout } = useAuth();
  const { connected } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Home" },
    ...(isAuthenticated && isStaff
      ? [
          { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
          { path: "/patients", label: "Patients", icon: <Users className="h-4 w-4" /> },
          { path: "/billing", label: "Billing", icon: <CreditCard className="h-4 w-4" /> },
        ]
      : []),
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Hospital className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-800">MedGrid</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <div
                  className={`flex items-center gap-1 px-3 py-2 rounded-md font-medium text-sm transition ${
                    isActive(link.path)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-3">
            {/* Live Connection */}
            {isAuthenticated && (
              <div
                className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${
                  connected
                    ? "text-green-700 border-green-700 bg-green-100"
                    : "text-red-700 border-red-700 bg-red-100"
                }`}
              >
                {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                <span>{connected ? "Live" : "Offline"}</span>
              </div>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{user?.fullName}</span>
                </button>

                {mobileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-medium text-gray-800">{user?.fullName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className="inline-block mt-1 text-xs text-gray-700 px-2 py-0.5 bg-gray-100 rounded-full">
                        {user?.role}
                      </span>
                    </div>
                    <button
                      onClick={() => navigate("/profile")}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Profile Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login">
                <div className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
                  Login
                </div>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Links */}
        {mobileOpen && (
          <div className="md:hidden flex flex-col space-y-1 py-2">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}>
                <div
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive(link.path)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

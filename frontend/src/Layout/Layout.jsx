import { Bell, Search, User, LogOut, TrendingUp, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logo from "../assets/logo.png";

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userInfo, setUserInfo] = useState(null);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const menuItems = [
        { path: "/", label: "Home", icon: <Home size={18} /> },
        { path: "/users", label: "Users", icon: <User size={18} />, role: "admin" },
    ];

    // Filter menu items based on user role
    const allowedMenuItems = menuItems.filter(item => {
        if (!item.role) return true; // accessible to all
        return userInfo?.role === item.role;
    });

    useEffect(() => {
        const storedUser = localStorage.getItem("userInfo");
        if (storedUser) {
            try {
                setUserInfo(JSON.parse(storedUser));
            } catch (e) {
                console.error("Invalid user data in localStorage");
            }
        }
    }, []);

    // Redirect non-admin users trying to access /users
    useEffect(() => {
        if (location.pathname === "/users" && userInfo?.role !== "admin") {
            navigate("/", { replace: true });
        }
    }, [location.pathname, userInfo, navigate]);

    const handleLogout = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userInfo");
        sessionStorage.clear();
        navigate("/login", { replace: true });
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Navbar */}
            <nav className="flex-shrink-0 bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Left: Logo */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <img 
                                    src={logo} 
                                    alt="Stocks Dashboard" 
                                    className="w-10 h-10 rounded-lg shadow-sm"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div 
                                    className="hidden w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg items-center justify-center"
                                >
                                    <TrendingUp size={20} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">Stocks Dashboard</h1>
                                    <p className="text-xs text-gray-500 hidden sm:block">Real-time market data</p>
                                </div>
                            </div>
                        </div>

                        {/* Center: Navigation */}
                        <div className="hidden md:flex items-center space-x-1">
                            {allowedMenuItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        location.pathname === item.path
                                            ? 'bg-blue-100 text-blue-700 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    <span className={location.pathname === item.path ? 'text-blue-600' : 'text-gray-400'}>
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Right: User & Actions */}
                        <div className="flex items-center space-x-4">
                            {/* Mobile menu */}
                            <div className="md:hidden">
                                <select
                                    value={location.pathname}
                                    onChange={(e) => navigate(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {allowedMenuItems.map((item) => (
                                        <option key={item.path} value={item.path}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="hidden sm:flex flex-col items-end">
                                        <span className="text-sm font-medium text-gray-900">
                                            {userInfo?.name || "John Doe"}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {userInfo?.email || "john@example.com"}
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-medium">
                                            {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : "J"}
                                        </span>
                                    </div>
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-gray-200">
                                            <p className="text-sm font-medium text-gray-900">
                                                {userInfo?.name || "John Doe"}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {userInfo?.email || "john@example.com"}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false);
                                                handleLogout();
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut size={16} className="mr-3" />
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Search Bar */}
            <div className="lg:hidden flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search stocks..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
                    />
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <Outlet />
                    </div>
                </div>
            </main>

            {/* Click outside to close menu */}
            {showUserMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                ></div>
            )}
        </div>
    );
};

export default Layout;
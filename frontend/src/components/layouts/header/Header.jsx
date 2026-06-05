import "./Header.scss";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    ChevronDown,
    Globe,
    LogOut,
    Search,
    User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
    getCurrentUser,
    isAuthenticated,
    logout,
} from "~/services/authService";

function Header() {
    const navigate = useNavigate();

    const [scrolled, setScrolled] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [avatarError, setAvatarError] = useState(false);
    const userMenuRef = useRef(null);

    const displayName =
        currentUser?.name ||
        currentUser?.email ||
        "Người dùng";

    const avatarUrl =
        currentUser?.avatarUrl ||
        currentUser?.avatar ||
        currentUser?.picture ||
        currentUser?.imageUrl ||
        currentUser?.photoURL;

    const avatarLetter =
        displayName.trim().charAt(0).toUpperCase() || "U";

    useEffect(() => {

        const handleScroll = () => {
            setScrolled(window.scrollY > 120);
        };

        window.addEventListener(
            "scroll",
            handleScroll
        );

        return () =>
            window.removeEventListener(
                "scroll",
                handleScroll
            );

    }, []);

    useEffect(() => {
        if (isAuthenticated()) {
            setCurrentUser(getCurrentUser());
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(event.target)
            ) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setCurrentUser(null);
        setShowUserMenu(false);
        navigate("/");
    };

    return (
        <header
            className={`header ${
                scrolled ? "scrolled" : ""
            }`}
        >

            {/* LOGO */}
            <div className="logo">
                <h2>TravelBot</h2>
            </div>

            {/* SEARCH WHEN SCROLL */}
            <div
                className={`header-search ${
                    scrolled ? "show" : ""
                }`}
            >

                <Search size={18} />

                <input
                    type="text"
                    placeholder="Tìm kiếm địa điểm..."
                />

            </div>

            {/* NAVIGATION */}
            <nav className="nav">
                <a href="/">Tổng quan</a>
                <a href="/chatbot">Chatbot</a>
                <a href="/maps">Bản đồ</a>
                <a href="/nearby">Gần tôi</a>
                <a href="/itinerary">Lịch trình AI</a>
            </nav>

            {/* ACTIONS */}
            <div className="header-actions">

                <button className="icon-btn">
                    <Globe size={20} />
                </button>

                {currentUser && (
                    <div
                        className="user-menu"
                        ref={userMenuRef}
                    >
                        <button
                            className="user-menu-trigger"
                            type="button"
                            onClick={() =>
                                setShowUserMenu((prev) => !prev)
                            }
                        >
                            {avatarUrl && !avatarError ? (
                                <img
                                    src={avatarUrl}
                                    alt={displayName}
                                    className="user-avatar-img"
                                    onError={() => setAvatarError(true)}
                                />
                            ) : (
                                <span className="user-avatar-fallback">
                                    {avatarLetter}
                                </span>
                            )}

                            <span className="user-name">
                                {displayName}
                            </span>

                            <ChevronDown
                                size={16}
                                className={
                                    showUserMenu ? "rotate" : ""
                                }
                            />
                        </button>

                        {showUserMenu && (
                            <div className="user-dropdown">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={16} />
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <button
                    className={`login-btn ${
                        currentUser ? "is-hidden" : ""
                    }`}
                    type="button"
                    onClick={() => navigate("/login")}
                >
                    <User size={18} />
                    <a href="/login">Đăng nhập</a>
                </button>

            </div>
        </header>
    );
}

export default Header;

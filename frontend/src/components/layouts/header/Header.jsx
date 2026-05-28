import "./Header.scss";

import { useEffect, useState } from "react";

import {
    Globe,
    Search,
    User,
} from "lucide-react";

function Header() {

    const [scrolled, setScrolled] = useState(false);

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
            </nav>

            {/* ACTIONS */}
            <div className="header-actions">

                <button className="icon-btn">
                    <Globe size={20} />
                </button>

                <button className="login-btn">
                    <User size={18} />
                    Đăng nhập
                </button>

                {/* <Dropdown
                    username={username}
                    onLogout={handleLogout}
                /> */}

            </div>
        </header>
    );
}

export default Header;
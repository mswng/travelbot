import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import "./adminLogin.scss";

import {
    FaUser,
    FaLock,
    FaEye,
    FaEyeSlash,
} from "react-icons/fa";

const AdminLogin = () => {

    const navigate = useNavigate();

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [form, setForm] = useState({
        username: "",
        password: "",
        remember: false,
    });

    const handleChange = (e) => {

        const {
            name,
            value,
            type,
            checked,
        } = e.target;

        setForm({
            ...form,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        });
    };

    const handleLogin = async (e) => {

        e.preventDefault();

        if (
            !form.username ||
            !form.password
        ) {
            return alert(
                "Nhập đầy đủ thông tin!"
            );
        }

        try {

            setLoading(true);

            // fake loading
            await new Promise((resolve) =>
                setTimeout(resolve, 1500)
            );

            if (form.remember) {
                localStorage.setItem(
                    "rememberUser",
                    form.username
                );
            }

            navigate("/admin");

        } catch (err) {

            alert(err.message);

        } finally {

            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">

            <div className="overlay" />

            <div className="login-card">

                <div className="login-top">

                    <h1>
                        TravelBot Admin
                    </h1>

                    <p>
                        Quản lý hệ thống AI du lịch
                    </p>

                </div>

                <form onSubmit={handleLogin}>

                    {/* USERNAME */}

                    <div className="input-box">

                        <FaUser className="icon" />

                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="Tên đăng nhập"
                        />

                    </div>

                    {/* PASSWORD */}

                    <div className="input-box">

                        <FaLock className="icon" />

                        <input
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Mật khẩu"
                        />

                        <button
                            type="button"
                            className="eye-btn"
                            onClick={() =>
                                setShowPassword(
                                    !showPassword
                                )
                            }
                        >

                            {showPassword
                                ? <FaEyeSlash />
                                : <FaEye />
                            }

                        </button>

                    </div>

                    {/* OPTIONS */}

                    <div className="options">

                        <label>

                            <input
                                type="checkbox"
                                name="remember"
                                checked={form.remember}
                                onChange={handleChange}
                            />

                            Ghi nhớ đăng nhập

                        </label>

                        <span>
                            Quên mật khẩu?
                        </span>

                    </div>

                    {/* BUTTON */}

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={loading}
                    >

                        {loading
                            ? "Đang đăng nhập..."
                            : "Đăng nhập"
                        }

                    </button>

                </form>

            </div>

        </div>
    );
};

export default AdminLogin;
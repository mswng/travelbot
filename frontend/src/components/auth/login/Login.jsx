import "./Login.scss";

import {
    useNavigate,
} from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();

    const handleGoogleLogin = () => {
        const redirectUri =
            `${window.location.origin}/oauth2/redirect`;

        window.location.href =
            `http://localhost:8080/travelbot/oauth2/authorize/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
    };

    return (
        <div className="login-page">
            <div className="login-overlay">
                <div className="login-modal">
                    <div className="logo-text">
                        TravelBot
                    </div>

                    <h1 className="title">
                        Xin chào 👋
                    </h1>

                    <p className="subtitle">
                        Đăng nhập để sử dụng chatbot và tạo lịch trình AI.
                    </p>

                    <div className="google-login-wrapper">
                        <button
                            className="login-btn-bot"
                            onClick={handleGoogleLogin}
                        >
                            <svg
                                className="google-icon"
                                viewBox="0 0 48 48"
                                aria-hidden="true"
                                focusable="false"
                            >
                                <path
                                    fill="#FFC107"
                                    d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                                />
                                <path
                                    fill="#FF3D00"
                                    d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                                />
                                <path
                                    fill="#4CAF50"
                                    d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
                                />
                                <path
                                    fill="#1976D2"
                                    d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                                />
                            </svg>
                            Đăng nhập bằng Google
                        </button>
                    </div>

                    <div className="divider">
                        <span>hoặc</span>
                    </div>

                    <button
                        className="guest-btn"
                        onClick={() => navigate("/")}
                    >
                        Tiếp tục với tư cách khách
                    </button>

                    <p className="footer-text">
                        Bằng việc đăng nhập,
                        bạn đồng ý với chúng tôi về

                        <span>
                            Điều khoản dịch vụ
                        </span>

                        và

                        <span>
                            Chính sách bảo mật
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

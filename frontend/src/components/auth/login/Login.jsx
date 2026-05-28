import "./Login.scss";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
    const navigate = useNavigate();

    return (

        <div className="login-page">

            <div className="login-overlay">

                <div className="login-modal">

                    {/* LOGO */}

                    <div className="logo-text">
                        TravelBot
                    </div>

                    {/* TITLE */}

                    <h1 className="title">
                        Xin chào 👋
                    </h1>

                    {/* SUBTITLE */}

                    <p className="subtitle">

                        Đăng nhập để khám phá những trải nghiệm du lịch tuyệt vời.

                    </p>

                    {/* GOOGLE BTN */}

                    <button className="login-btn">

                        <FcGoogle size={26} />

                        Đăng nhập với Google

                    </button>

                    {/* DIVIDER */}

                    <div className="divider">

                        <span>
                            hoặc
                        </span>

                    </div>

                    {/* GUEST BTN */}

                    <button
                        className="guest-btn"
                        onClick={() => navigate("/")}
                    >

                        Tiếp tục với tư cách khách

                    </button>

                    {/* FOOTER */}

                    <p className="footer-text">

                        Bằng việc đăng nhập, bạn đồng ý với chúng tôi về <span>Điều khoản dịch vụ</span> và <span>Chính sách bảo mật</span>

                    </p>

                </div>

            </div>

        </div>
    );
}
import "./Login.scss";

import {
    useNavigate,
} from "react-router-dom";

import {
    useState,
} from "react";

import {
    GoogleLogin,
} from "@react-oauth/google";

import {
    googleLogin,
    saveAuth,
} from "~/services/authService";

export default function Login() {

    const navigate =
        useNavigate();

    const [loading, setLoading] =
        useState(false);

    /* GOOGLE LOGIN */

    const handleGoogleSuccess =
    async (credentialResponse) => {

        try {

            setLoading(true);

            console.log(
                credentialResponse
            );

            /* CALL BACKEND */

            const data =
                await googleLogin(

                    credentialResponse.credential
                );

            console.log(data);

            /* SAVE */

            saveAuth(

                data.token,

                data.user
            );

            /* REDIRECT */

            navigate("/");

        } catch (err) {

            console.log(err);

            alert(
                "Đăng nhập thất bại"
            );

        } finally {

            setLoading(false);
        }
    };

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

                        Đăng nhập để khám phá
                        những trải nghiệm du lịch tuyệt vời.

                    </p>

                    {/* GOOGLE LOGIN */}

                    <div className="google-login-wrapper">

                        {loading ? (

                            <button
                                className="login-btn"
                                disabled
                            >

                                Đang đăng nhập...

                            </button>

                        ) : (

                            <GoogleLogin

                                onSuccess={
                                    handleGoogleSuccess
                                }

                                onError={() => {

                                    alert(
                                        "Google Login Failed"
                                    );
                                }}
                            />
                        )}

                    </div>

                    {/* DIVIDER */}

                    <div className="divider">

                        <span>
                            hoặc
                        </span>

                    </div>

                    {/* GUEST BTN */}

                    <button
                        className="guest-btn"
                        onClick={() =>

                            navigate("/")
                        }
                    >

                        Tiếp tục với tư cách khách

                    </button>

                    {/* FOOTER */}

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
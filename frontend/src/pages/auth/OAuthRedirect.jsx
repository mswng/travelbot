import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
    fetchCurrentUser,
    saveAuth,
} from "~/services/authService";

export default function OAuthRedirect() {
    const navigate = useNavigate();

    useEffect(() => {
        const completeLogin = async () => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get("token");
            const error = params.get("error");

            if (error || !token) {
                navigate("/login", {
                    replace: true,
                    state: {
                        error: error || "Google login failed",
                    },
                });
                return;
            }

            localStorage.setItem("token", token);

            try {
                const user = await fetchCurrentUser();
                saveAuth(token, user);
            } catch {
                saveAuth(token, null);
            }

            navigate("/", { replace: true });
        };

        completeLogin();
    }, [navigate]);

    return (
        <div style={{ padding: 40 }}>
            Dang hoan tat dang nhap...
        </div>
    );
}

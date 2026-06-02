import axiosClient from "./axiosClient";

export const adminLogin =
async (username, password) => {

    const res =
        await axiosClient.post(

            "/auth/admin/login",

            {
                email,
                password,
            }
        );

    return res.data;
};

/* ========================= */
/* GOOGLE LOGIN */
/* ========================= */

export const googleLogin =
async (googleToken) => {

    const res =
        await axiosClient.post(

            "/auth/google",

            {
                token: googleToken,
            }
        );

    return res.data;
};

/* ========================= */
/* LOGOUT */
/* ========================= */

export const logout = () => {

    localStorage.removeItem("token");

    localStorage.removeItem("user");
};

/* ========================= */
/* SAVE AUTH */
/* ========================= */

export const saveAuth = (
    token,
    user
) => {

    localStorage.setItem(
        "token",
        token
    );

    localStorage.setItem(
        "user",
        JSON.stringify(user)
    );
};

/* ========================= */
/* GET USER */
/* ========================= */

export const getCurrentUser = () => {

    const user =
        localStorage.getItem("user");

    return user
        ? JSON.parse(user)
        : null;
};

/* ========================= */
/* CHECK LOGIN */
/* ========================= */

export const isAuthenticated = () => {

    return !!localStorage.getItem("token");
};
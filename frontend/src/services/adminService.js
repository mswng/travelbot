import axiosClient from "./axiosClient";

/* DASHBOARD */

export const getDashboard =
async () => {

    const res =
        await axiosClient.get("/admin/dashboard");

    return res.data;
};

/* ========================= */
/* PLACES */
/* ========================= */

export const getPlaces =
async (page = 0, size = 10) => {

    const res =
        await axiosClient.get(

            `/admin/places?page=${page}&size=${size}`
        );

    return res.data;
};

export const getPlaceById =
async (id) => {

    const res =
        await axiosClient.get(
            `/admin/places/${id}`
        );

    return res.data;
};

export const createPlace =
async (data) => {

    const res =
        await axiosClient.post(
            "/admin/places",
            data
        );

    return res.data;
};

export const updatePlace =
async (id, data) => {

    const res =
        await axiosClient.put(
            `/admin/places/${id}`,
            data
        );

    return res.data;
};

export const deletePlace =
async (id) => {

    const res =
        await axiosClient.delete(
            `/admin/places/${id}`
        );

    return res.data;
};

/* ========================= */
/* USERS */
/* ========================= */

export const getUsers =
async (page = 0, size = 10) => {

    const res =
        await axiosClient.get(

            `/admin/users?page=${page}&size=${size}`
        );

    return res.data;
};

export const getUserById =
async (id) => {

    const res =
        await axiosClient.get(
            `/admin/users/${id}`
        );

    return res.data;
};

export const createUser =
async (data) => {

    const res =
        await axiosClient.post(
            "/admin/users",
            data
        );

    return res.data;
};

export const updateUser =
async (id, data) => {

    const res =
        await axiosClient.put(
            `/admin/users/${id}`,
            data
        );

    return res.data;
};

export const deleteUser =
async (id) => {

    const res =
        await axiosClient.delete(
            `/admin/users/${id}`
        );

    return res.data;
};
import axiosClient from "./axiosClient";
import { unwrapApi } from "./apiUtils";

/* DASHBOARD */

export const getDashboard =
async () => {

    const res =
        await axiosClient.get("/admin/dashboard");

    return unwrapApi(res);
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

    return unwrapApi(res);
};

export const getPlaceById =
async (id) => {

    const res =
        await axiosClient.get(
            `/admin/places/${id}`
        );

    return unwrapApi(res);
};

export const createPlace =
async (data) => {

    const res =
        await axiosClient.post(
            "/admin/places",
            data
        );

    return unwrapApi(res);
};

export const updatePlace =
async (id, data) => {

    const res =
        await axiosClient.put(
            `/admin/places/${id}`,
            data
        );

    return unwrapApi(res);
};

export const deletePlace =
async (id) => {

    const res =
        await axiosClient.delete(
            `/admin/places/${id}`
        );

    return unwrapApi(res);
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

    return unwrapApi(res);
};

export const getUserById =
async (id) => {

    const res =
        await axiosClient.get(
            `/admin/users/${id}`
        );

    return unwrapApi(res);
};

export const createUser =
async (data) => {

    const res =
        await axiosClient.post(
            "/admin/users",
            data
        );

    return unwrapApi(res);
};

export const updateUser =
async (id, data) => {

    const res =
        await axiosClient.put(
            `/admin/users/${id}`,
            data
        );

    return unwrapApi(res);
};

export const deleteUser =
async (id) => {

    const res =
        await axiosClient.delete(
            `/admin/users/${id}`
        );

    return unwrapApi(res);
};

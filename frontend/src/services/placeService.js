import axiosClient from "./axiosClient";
import { buildQuery, unwrapApi } from "./apiUtils";

export const getPublicPlaces = async (params = {}) => {
    const query = buildQuery(params);
    const res = await axiosClient.get(`/places${query ? `?${query}` : ""}`);
    return unwrapApi(res);
};

export const getPublicPlaceById = async (id) => {
    const res = await axiosClient.get(`/places/${id}`);
    return unwrapApi(res);
};

export const getHomeData = async () => {
    const res = await axiosClient.get("/places/home");
    return unwrapApi(res);
};

export const getNearbyPlaces = async (params = {}) => {
    const query = buildQuery(params);
    const res = await axiosClient.get(`/places/nearby${query ? `?${query}` : ""}`);
    return unwrapApi(res);
};

export const getTopRatedPlaces = async (limit = 6) => {
    const res = await axiosClient.get(`/places/top-rated?limit=${limit}`);
    return unwrapApi(res);
};

export const getPlaceCities = async () => {
    const res = await axiosClient.get("/places/cities");
    return unwrapApi(res);
};

export const getPlaceTypes = async () => {
    const res = await axiosClient.get("/places/types");
    return unwrapApi(res);
};

import axiosClient from "./axiosClient";
import { buildQuery, unwrapApi } from "./apiUtils";

export const generateItinerary = async (data) => {
    const res = await axiosClient.post("/itineraries/generate", data);
    return unwrapApi(res);
};

export const getItineraries = async (params = {}) => {
    const query = buildQuery(params);
    const res = await axiosClient.get(`/itineraries${query ? `?${query}` : ""}`);
    return unwrapApi(res);
};

export const getItineraryById = async (id) => {
    const res = await axiosClient.get(`/itineraries/${id}`);
    return unwrapApi(res);
};

export const deleteItinerary = async (id) => {
    const res = await axiosClient.delete(`/itineraries/${id}`);
    return unwrapApi(res);
};

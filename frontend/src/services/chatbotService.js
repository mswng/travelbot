import axiosClient from "./axiosClient";
import { unwrapApi } from "./apiUtils";

export const sendChatMessage = async ({ message, sessionId }) => {
    const res = await axiosClient.post("/chatbot/chat", {
        message,
        sessionId,
    });
    return unwrapApi(res);
};

export const getChatSessions = async () => {
    const res = await axiosClient.get("/chatbot/sessions");
    return unwrapApi(res);
};

export const getChatHistory = async (sessionId) => {
    const res = await axiosClient.get(`/chatbot/history/${sessionId}`);
    return unwrapApi(res);
};

export const clearChatSession = async (sessionId) => {
    const res = await axiosClient.delete(`/chatbot/session/${sessionId}`);
    return unwrapApi(res);
};

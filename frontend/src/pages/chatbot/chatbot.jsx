import "./Chatbot.scss";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import Sidebar from "~/components/chatbot/Sidebar/Sidebar.jsx";
import ChatHeader from "~/components/chatbot/ChatHeader/ChatHeader.jsx";
import MessageBubble from "~/components/chatbot/MessageBubble/MessageBubble.jsx";
import ChatInput from "~/components/chatbot/ChatInput/ChatInput.jsx";
import { sendChatMessage } from "~/services/chatbotService";

const defaultMessage = {
    role: "assistant",
    text: "Xin chao, minh la TravelBot. Hom nay ban muon kham pha noi nao?",
};

export default function Chatbot() {
    const [messages, setMessages] = useState([defaultMessage]);
    const [sessionId, setSessionId] = useState(
        localStorage.getItem("chatbotSessionId") || null
    );
    const [sending, setSending] = useState(false);

    const chatContainerRef = useRef(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (message) => {
        if (!message.trim() || sending) return;

        const userMessage = {
            role: "user",
            text: message,
        };

        setMessages((prev) => [
            ...prev,
            userMessage,
        ]);

        try {
            setSending(true);

            const result = await sendChatMessage({
                message,
                sessionId,
            });

            if (result.sessionId) {
                setSessionId(result.sessionId);
                localStorage.setItem("chatbotSessionId", result.sessionId);
            }

            setMessages((prev) => [
                ...prev,
                {
                    role: result.role || "assistant",
                    text: result.message || result.answer || "TravelBot chua co cau tra loi.",
                },
            ]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text:
                        err.response?.data?.message ||
                        "Khong goi duoc chatbot. Kiem tra backend va chatbot-service.",
                },
            ]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="chatbot-page">
            <Sidebar />

            <div className="chatbot-main">
                <ChatHeader />

                <div
                    className="chat-messages"
                    ref={chatContainerRef}
                >
                    {messages.map((msg, index) => (
                        <MessageBubble
                            key={index}
                            role={msg.role}
                            text={msg.text}
                        />
                    ))}

                    {sending && (
                        <MessageBubble
                            role="assistant"
                            text="TravelBot dang suy nghi..."
                        />
                    )}
                </div>

                <ChatInput onSend={handleSendMessage} />
            </div>
        </div>
    );
}

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
import {
    getChatHistory,
    getChatSessions,
    sendChatMessage,
} from "~/services/chatbotService";

const defaultMessage = {
    role: "assistant",
    text: "Xin chào, mình là TravelBot. Hôm nay bạn muốn khám phá nơi nào?",
};

const toMessage = (message) => ({
    id: message.id,
    role: String(message.role || "assistant").toLowerCase(),
    text: message.content || message.message || "",
});

export default function Chatbot() {
    const [messages, setMessages] = useState([defaultMessage]);
    const [sessionId, setSessionId] = useState(
        localStorage.getItem("chatbotSessionId") || null
    );
    const [sessions, setSessions] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [sending, setSending] = useState(false);

    const chatContainerRef = useRef(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    useEffect(() => {
        if (sessionId) {
            fetchHistory(sessionId);
        }
    }, [sessionId]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchSessions = async () => {
        try {
            setHistoryLoading(true);
            const data = await getChatSessions();
            const nextSessions = Array.isArray(data) ? data : [];

            setSessions(nextSessions);

            const storedSessionId = localStorage.getItem("chatbotSessionId");
            const hasStoredSession = nextSessions.some(
                (session) => session.sessionId === storedSessionId
            );
            const hasCurrentSession = nextSessions.some(
                (session) => session.sessionId === sessionId
            );

            if (storedSessionId && hasStoredSession) {
                if (sessionId !== storedSessionId) {
                    setSessionId(storedSessionId);
                }
            } else if (nextSessions.length > 0 && (!sessionId || !hasCurrentSession)) {
                setSessionId(nextSessions[0].sessionId);
                localStorage.setItem("chatbotSessionId", nextSessions[0].sessionId);
            } else if (nextSessions.length === 0) {
                setSessionId(null);
                setMessages([defaultMessage]);
                localStorage.removeItem("chatbotSessionId");
            }
        } catch {
            setSessions([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchHistory = async (nextSessionId) => {
        try {
            setHistoryLoading(true);
            const data = await getChatHistory(nextSessionId);
            const historyMessages = Array.isArray(data) ? data.map(toMessage) : [];

            setMessages(historyMessages.length > 0 ? historyMessages : [defaultMessage]);
        } catch {
            setMessages([
                defaultMessage,
                {
                    role: "assistant",
                    text: "Không tải được lịch sử trò chuyện. Vui lòng thử lại sau.",
                },
            ]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleNewChat = () => {
        setSessionId(null);
        setMessages([defaultMessage]);
        localStorage.removeItem("chatbotSessionId");
    };

    const handleSelectSession = (nextSessionId) => {
        if (nextSessionId === sessionId) return;

        setSessionId(nextSessionId);
        localStorage.setItem("chatbotSessionId", nextSessionId);
    };

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
                    role: String(result.role || "assistant").toLowerCase(),
                    text: result.message || result.answer || "TravelBot chưa có câu trả lời.",
                },
            ]);

            fetchSessions();
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    text:
                        err.response?.data?.message ||
                        "Không gọi được chatbot. Kiểm tra backend và chatbot-service.",
                },
            ]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="chatbot-page">
            <Sidebar
                activeSessionId={sessionId}
                loading={historyLoading}
                sessions={sessions}
                onNewChat={handleNewChat}
                onSelectSession={handleSelectSession}
            />

            <div className="chatbot-main">
                <ChatHeader />

                <div
                    className="chat-messages"
                    ref={chatContainerRef}
                >
                    {messages.map((msg, index) => (
                        <MessageBubble
                            key={msg.id || `${msg.role}-${index}`}
                            role={msg.role}
                            text={msg.text}
                        />
                    ))}

                    {sending && (
                        <MessageBubble
                            role="assistant"
                            text="TravelBot đang suy nghĩ..."
                        />
                    )}
                </div>

                <ChatInput
                    disabled={sending}
                    onSend={handleSendMessage}
                />
            </div>
        </div>
    );
}

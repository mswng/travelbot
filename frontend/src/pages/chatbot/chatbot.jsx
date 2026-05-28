import "./Chatbot.scss";

import {
    useState,
    useEffect,
    useRef,
} from "react";

import Sidebar from "~/components/chatbot/Sidebar/Sidebar.jsx";
import ChatHeader from "~/components/chatbot/ChatHeader/ChatHeader.jsx";
import MessageBubble from "~/components/chatbot/MessageBubble/MessageBubble.jsx";
import ChatInput from "~/components/chatbot/ChatInput/ChatInput.jsx";

export default function Chatbot() {

    const [messages, setMessages] = useState([
        {
            role: "assistant",
            text: "Xin chào 👋 Mình là TravelBot. Hôm nay bạn muốn khám phá nơi nào?",
        },
    ]);

    // ref cho container chat
    const chatContainerRef = useRef(null);

    // scroll CHỈ TRONG CHAT
    useEffect(() => {

        if (chatContainerRef.current) {

            chatContainerRef.current.scrollTop =
                chatContainerRef.current.scrollHeight;
        }

    }, [messages]);

    const handleSendMessage = (message) => {

        if (!message.trim()) return;

        const newUserMessage = {
            role: "user",
            text: message,
        };

        setMessages((prev) => [
            ...prev,
            newUserMessage,
        ]);

        setTimeout(() => {

            const aiMessage = {
                role: "assistant",
                text: `✨ TravelBot đang tìm thông tin cho: "${message}"`,
            };

            setMessages((prev) => [
                ...prev,
                aiMessage,
            ]);

        }, 1000);
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

                </div>

                <ChatInput
                    onSend={handleSendMessage}
                />

            </div>

        </div>
    );
}
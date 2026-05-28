import "./MessageBubble.scss";

import { Bot, User } from "lucide-react";

export default function MessageBubble({ role, text }) {

    const isUser = role === "user";

    return (
        <div
            className={`message-row ${
                isUser ? "user" : "assistant"
            }`}
        >

            {!isUser && (
                <div className="message-avatar bot">
                    <Bot size={18} />
                </div>
            )}

            <div className="message-bubble">
                {text}
            </div>

            {isUser && (
                <div className="message-avatar user-avatar">
                    <User size={18} />
                </div>
            )}

        </div>
    );
}
import "./ChatInput.scss";

import { useState } from "react";

import {
    SendHorizonal,
} from "lucide-react";

export default function ChatInput({
    disabled = false,
    onSend,
}) {
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (!message.trim() || disabled) return;

        onSend(message);
        setMessage("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    return (
        <div className="chat-input-wrapper">
            <div className="chat-input-box">
                <input
                    type="text"
                    placeholder="Hỏi TravelBot về địa điểm, lịch trình, khách sạn..."
                    value={message}
                    disabled={disabled}
                    onChange={(e) =>
                        setMessage(e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                />

                <button
                    className="send-btn"
                    disabled={disabled}
                    type="button"
                    onClick={handleSend}
                >
                    <SendHorizonal size={18} />
                </button>
            </div>

            <p className="chat-input-note">
                TravelBot có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
            </p>
        </div>
    );
}

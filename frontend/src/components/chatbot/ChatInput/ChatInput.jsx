import "./ChatInput.scss";

import { useState } from "react";

import {
    Image,
    Mic,
    SendHorizonal,
} from "lucide-react";

export default function ChatInput({ onSend }) {

    const [message, setMessage] = useState("");

    const handleSend = () => {

        if (!message.trim()) return;

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

                <button>
                    <Image size={20} />
                </button>

                <input
                    type="text"
                    placeholder="Hỏi TravelBot về địa điểm, lịch trình, khách sạn..."
                    value={message}
                    onChange={(e) =>
                        setMessage(e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                />

                <button>
                    <Mic size={20} />
                </button>

                <button
                    className="send-btn"
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
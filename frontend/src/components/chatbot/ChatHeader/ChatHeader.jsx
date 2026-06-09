import "./ChatHeader.scss";

import { Bot } from "lucide-react";

export default function ChatHeader() {
    return (
        <div className="chat-header">
            <div className="chat-header-left">
                <div className="bot-avatar">
                    <Bot size={20} />
                </div>

                <div>
                    <h3>Trợ lý TravelBot</h3>
                    <p>Sẵn sàng hỗ trợ chuyến đi của bạn</p>
                </div>
            </div>
        </div>
    );
}

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
                    <h3>TravelBot Assistant</h3>
                    <p>Online</p>
                </div>

            </div>

        </div>
    );
}
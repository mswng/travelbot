import "./Sidebar.scss";

import {
    Compass,
    MessageSquare,
    Plus,
    Map,
    Sparkles,
} from "lucide-react";

export default function Sidebar() {
    return (
        <aside className="chat-sidebar">

            <div>

                <button className="new-chat-btn">
                    <Plus size={18} />
                    New Chat
                </button>

                <div className="sidebar-section">
                    <p className="sidebar-title">
                        Explore
                    </p>

                    <button>
                        <Compass size={18} />
                        Popular Places
                    </button>

                    <button>
                        <Map size={18} />
                        Travel Guides
                    </button>

                    <button>
                        <Sparkles size={18} />
                        AI Suggestions
                    </button>
                </div>

            </div>

            <div className="history-section">

                <p className="sidebar-title">
                    Recent Chats
                </p>

                <button>
                    <MessageSquare size={16} />
                    Trip to Đà Lạt
                </button>

                <button>
                    <MessageSquare size={16} />
                    Bali Travel Plan
                </button>

            </div>

        </aside>
    );
}
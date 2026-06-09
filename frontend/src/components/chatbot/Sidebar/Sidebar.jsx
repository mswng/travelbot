import "./Sidebar.scss";

import {
    MessageSquare,
    Plus,
} from "lucide-react";

export default function Sidebar({
    activeSessionId,
    loading = false,
    onNewChat,
    onSelectSession,
    sessions = [],
}) {
    return (
        <aside className="chat-sidebar">
            <div>
                <button
                    className="new-chat-btn"
                    type="button"
                    onClick={onNewChat}
                >
                    <Plus size={18} />
                    Cuộc trò chuyện mới
                </button>
            </div>

            <div className="history-section">
                <p className="sidebar-title">
                    Lịch sử trò chuyện
                </p>

                {loading && (
                    <p className="sidebar-empty">Đang tải lịch sử...</p>
                )}

                {!loading && sessions.length === 0 && (
                    <p className="sidebar-empty">Chưa có cuộc trò chuyện nào.</p>
                )}

                {!loading && sessions.map((session) => (
                    <button
                        key={session.sessionId}
                        className={session.sessionId === activeSessionId ? "active" : ""}
                        type="button"
                        onClick={() => onSelectSession(session.sessionId)}
                    >
                        <MessageSquare size={16} />
                        <span>{session.title || "Cuộc trò chuyện mới"}</span>
                    </button>
                ))}
            </div>
        </aside>
    );
}

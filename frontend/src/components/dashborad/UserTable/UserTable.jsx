import "./UserTable.scss";

const formatRole = (role = "") => {
    if (role === "ROLE_ADMIN" || role === "ADMIN") return "Quản trị";
    return "Người dùng";
};

const formatDate = (value) => {
    if (!value) return "Chưa có";

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
};

export default function UserTable({
    users = [],
}) {
    return (
        <div className="user-table-card">
            <table>
                <thead>
                    <tr>
                        <th>Người dùng</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Ngày đăng ký</th>
                    </tr>
                </thead>

                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.name || "Chưa cập nhật"}</td>
                            <td>{user.email}</td>
                            <td>
                                <span className={
                                    user.role === "ROLE_ADMIN" || user.role === "ADMIN"
                                        ? "role admin"
                                        : "role user"
                                }>
                                    {formatRole(user.role)}
                                </span>
                            </td>
                            <td>{formatDate(user.createdAt)}</td>
                        </tr>
                    ))}

                    {users.length === 0 && (
                        <tr>
                            <td colSpan={4}>Chưa có người dùng mới.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

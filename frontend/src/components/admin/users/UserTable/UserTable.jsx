import "./UserTable.scss";

import {
    Pencil,
    Trash2,
    Shield,
} from "lucide-react";

export default function UserTable({
    users,
    onDelete,
    onEdit,
}) {

    return (

        <div className="user-table-card">

            <table>

                <thead>

                    <tr>

                        <th>Người dùng</th>

                        <th>Email</th>

                        <th>Vai trò</th>

                        <th>Hoạt động</th>

                    </tr>

                </thead>

                <tbody>

                    {users.map((user) => (

                        <tr key={user.id}>

                            <td>{user.name}</td>

                            <td>{user.email}</td>

                            <td>

                                <span
                                    className={
                                        user.role === "ADMIN"
                                            ? "role admin"
                                            : "role user"
                                    }
                                >

                                    <Shield size={14} />

                                    {user.role}

                                </span>

                            </td>

                            <td>

                                <div className="actions">

                                    <button
                                        onClick={() => onEdit(user)}
                                    >
                                        <Pencil size={16} />
                                    </button>

                                    <button
                                        className="delete"
                                        onClick={() =>
                                            onDelete(user.id)
                                        }
                                    >

                                        <Trash2 size={16} />

                                    </button>

                                </div>

                            </td>

                        </tr>
                    ))}

                </tbody>

            </table>

        </div>
    );
}
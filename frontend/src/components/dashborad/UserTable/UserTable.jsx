import "./UserTable.scss";

import {
    Pencil,
    Trash2,
} from "lucide-react";

export default function UserTable({
    users,
}) {

    return (
        <div className="user-table-card">

            <table>

                <thead>

                    <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>

                </thead>

                <tbody>

                    {users.map((user) => (

                        <tr key={user.id}>

                            <td>{user.name}</td>

                            <td>{user.email}</td>

                            <td>
                                <span className={
                                    user.role === "ADMIN"
                                        ? "role admin"
                                        : "role user"
                                }>
                                    {user.role}
                                </span>
                            </td>

                            <td>

                                <div className="actions">

                                    <button>
                                        <Pencil size={16} />
                                    </button>

                                    <button className="delete">
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
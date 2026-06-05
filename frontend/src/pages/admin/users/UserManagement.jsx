import "./UserManagement.scss";

import {
    useEffect,
    useState,
} from "react";

import UserTable
from "~/components/admin/users/UserTable/UserTable.jsx";

import UserModal
from "~/components/admin/users/UserModal/UserModal.jsx";

import { Plus } from "lucide-react";

import {
    createUser,
    deleteUser,
    getUsers,
    updateUser,
} from "~/services/adminService";

import {
    unwrapPageContent,
} from "~/services/apiUtils";

export default function UserManagement() {

    /* USERS */

    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    useEffect(() => {

        fetchUsers();

    }, []);

    const normalizeUser = (user) => ({
        ...user,
        role: user.role?.replace("ROLE_", "") || "USER",
    });

    const toUserRequest = (user) => ({
        name: user.name,
        email: user.email,
        password: user.password,
        role: user.role?.startsWith("ROLE_")
            ? user.role
            : `ROLE_${user.role || "USER"}`,
    });

    const fetchUsers = async () => {

        try {

            setLoading(true);
            setError("");

            const data = await getUsers(0, 10);

            setUsers(
                unwrapPageContent(data).map(normalizeUser)
            );

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không tải được danh sách người dùng"
            );

        } finally {

            setLoading(false);
        }
    };

    /* MODAL */

    const [openModal, setOpenModal] = useState(false);

    /* EDIT MODE */

    const [editingUser, setEditingUser] = useState(null);

    /* DELETE */

    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(
            "Delete this user?"
        );

        if (!confirmDelete) return;

        await deleteUser(id);

        fetchUsers();
    };

    /* ADD */

    const handleAddUser = async (newUser) => {

        await createUser(toUserRequest(newUser));

        fetchUsers();
    };

    /* EDIT */

    const handleEdit = (user) => {

        setEditingUser(user);

        setOpenModal(true);
    };

    /* UPDATE */

    const handleUpdateUser = async (updatedUser) => {

        const { password, ...payload } =
            toUserRequest(updatedUser);

        await updateUser(updatedUser.id, payload);

        fetchUsers();
    };

    /* CLOSE MODAL */

    const handleCloseModal = () => {

        setOpenModal(false);

        setEditingUser(null);
    };

    return (

        <div className="user-page">

            {/* TOP */}

            <div className="user-top">

                <div>

                    <h1>Quản lý người dùng</h1>

                    <p>
                        Quản lý tài khoản admin và người dùng.
                    </p>

                </div>

                <button
                    className="add-btn"
                    onClick={() => {

                        setEditingUser(null);

                        setOpenModal(true);
                    }}
                >

                    <Plus size={18} />

                    Thêm Admin

                </button>

            </div>

            {/* TABLE */}

            {loading && (
                <p>Đang tải người dùng...</p>
            )}

            {error && (
                <p>{error}</p>
            )}

            <UserTable
                users={users}
                onDelete={handleDelete}
                onEdit={handleEdit}
            />

            {/* MODAL */}

            <UserModal
                open={openModal}
                onClose={handleCloseModal}
                onAdd={handleAddUser}
                onEdit={handleUpdateUser}
                editingUser={editingUser}
            />
        </div>
    );
}

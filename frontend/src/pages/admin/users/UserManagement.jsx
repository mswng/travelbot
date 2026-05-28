import "./UserManagement.scss";

import { useState } from "react";

import UserTable
from "~/components/admin/users/UserTable/UserTable.jsx";

import UserModal
from "~/components/admin/users/UserModal/UserModal.jsx";

import { Plus } from "lucide-react";

export default function UserManagement() {

    /* USERS */

    const [users, setUsers] = useState([

        {
            id: 1,
            name: "Nguyen Van A",
            email: "admin@gmail.com",
            role: "ADMIN",
        },

        {
            id: 2,
            name: "Tran Thi B",
            email: "user@gmail.com",
            role: "USER",
        },
    ]);

    /* MODAL */

    const [openModal, setOpenModal] = useState(false);

    /* EDIT MODE */

    const [editingUser, setEditingUser] = useState(null);

    /* DELETE */

    const handleDelete = (id) => {

        const confirmDelete = window.confirm(
            "Delete this user?"
        );

        if (!confirmDelete) return;

        setUsers((prev) =>
            prev.filter((user) => user.id !== id)
        );
    };

    /* ADD */

    const handleAddUser = (newUser) => {

        setUsers((prev) => [

            ...prev,

            {
                ...newUser,
                id: Date.now(),
            },
        ]);
    };

    /* EDIT */

    const handleEdit = (user) => {

        setEditingUser(user);

        setOpenModal(true);
    };

    /* UPDATE */

    const handleUpdateUser = (updatedUser) => {

        setUsers((prev) =>

            prev.map((user) =>

                user.id === updatedUser.id
                    ? updatedUser
                    : user
            )
        );
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
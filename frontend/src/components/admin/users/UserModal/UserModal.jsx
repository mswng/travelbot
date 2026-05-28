import "./UserModal.scss";

import {
    useState,
    useEffect,
} from "react";

import { X } from "lucide-react";

export default function UserModal({
    open,
    onClose,
    onAdd,
    onEdit,
    editingUser,
}) {

    /* FORM */

    const [form, setForm] = useState({

        id: null,

        name: "",

        email: "",

        role: "USER",
    });

    /* FILL EDIT DATA */

    useEffect(() => {

        if (editingUser) {

            setForm({

                id: editingUser.id,

                name: editingUser.name,

                email: editingUser.email,

                role: editingUser.role,
            });

        } else {

            setForm({

                id: null,

                name: "",

                email: "",

                role: "USER",
            });
        }

    }, [editingUser]);

    /* CLOSE */

    if (!open) return null;

    /* CHANGE */

    const handleChange = (e) => {

        const {
            name,
            value,
        } = e.target;

        setForm((prev) => ({

            ...prev,

            [name]: value,
        }));
    };

    /* SUBMIT */

    const handleSubmit = (e) => {

        e.preventDefault();

        /* VALIDATE */

        if (
            !form.name.trim() ||
            !form.email.trim()
        ) {

            alert("Please fill all fields");

            return;
        }

        /* EDIT */

        if (editingUser) {

            onEdit(form);

        } else {

            /* ADD */

            onAdd({

                ...form,

                id: Date.now(),
            });
        }

        /* RESET */

        setForm({

            id: null,

            name: "",

            email: "",

            role: "USER",
        });

        /* CLOSE */

        onClose();
    };

    return (

        <div className="modal-overlay">

            <div className="user-modal">

                {/* CLOSE BTN */}

                <button
                    className="close-btn"
                    onClick={onClose}
                >

                    <X size={20} />

                </button>

                {/* TITLE */}

                <h2>

                    {editingUser
                        ? "Chỉnh sửa người dùng"
                        : "Thêm người dùng"}

                </h2>

                {/* FORM */}

                <form onSubmit={handleSubmit}>

                    {/* NAME */}

                    <div className="form-group">

                        <label>
                            Tên đăng nhập
                        </label>

                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Nhập tên đăng nhập"
                        />

                    </div>

                    {/* EMAIL */}

                    <div className="form-group">

                        <label>
                            Email
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Nhập email"
                        />

                    </div>

                    {/* ROLE */}

                    <div className="form-group">

                        <label>
                            Vai trò
                        </label>

                        <select
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                        >

                            <option value="USER">
                                USER
                            </option>

                            <option value="ADMIN">
                                ADMIN
                            </option>

                        </select>

                    </div>

                    {/* SUBMIT */}

                    <button
                        type="submit"
                        className="submit-btn"
                    >

                        {editingUser
                            ? "Lưu thay đổi"
                            : "Thêm người dùng"}

                    </button>

                </form>

            </div>

        </div>
    );
}
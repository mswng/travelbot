import "./PlaceModal.scss";

import {
    useState,
    useEffect,
} from "react";

import { X } from "lucide-react";

export default function PlaceModal({
    open,
    onClose,
    onAdd,
    onUpdate,
    editingPlace,
}) {

    const [form, setForm] = useState({

        id: null,

        title: "",

        image: "",

        location: "",

        openTime: "",

        price: "",

        description: "",

        map: "",
    });

    /* EDIT DATA */

    useEffect(() => {

        if (editingPlace) {

            setForm(editingPlace);

        } else {

            setForm({

                id: null,

                title: "",

                image: "",

                location: "",

                openTime: "",

                price: "",

                description: "",

                map: "",
            });
        }

    }, [editingPlace]);

    /* CLOSE */

    if (!open) return null;

    /* CHANGE */

    const handleChange = (e) => {

        setForm({

            ...form,

            [e.target.name]: e.target.value,
        });
    };

    /* SUBMIT */

    const handleSubmit = (e) => {

        e.preventDefault();

        if (editingPlace) {

            onUpdate(form);

        } else {

            onAdd({

                ...form,

                id: Date.now(),
            });
        }

        onClose();
    };

    return (

        <div className="modal-overlay">

            <div className="place-modal">

                {/* CLOSE BUTTON */}

                <button
                    className="close-modal-btn"
                    onClick={onClose}
                >

                    <X size={20} />

                </button>

                {/* TITLE */}

                <h2>

                    {editingPlace
                        ? "Chỉnh sửa địa điểm"
                        : "Thêm địa điểm"}

                </h2>

                {/* FORM */}

                <form onSubmit={handleSubmit}>

                    <input
                        name="title"
                        placeholder="Tên địa điểm"
                        value={form.title}
                        onChange={handleChange}
                    />

                    <input
                        name="location"
                        placeholder="Địa chỉ"
                        value={form.location}
                        onChange={handleChange}
                    />

                    <input
                        name="openTime"
                        placeholder="Giờ mở cửa"
                        value={form.openTime}
                        onChange={handleChange}
                    />

                    <input
                        name="price"
                        placeholder="Giá vé"
                        value={form.price}
                        onChange={handleChange}
                    />

                    <input
                        name="image"
                        placeholder="URL hình ảnh"
                        value={form.image}
                        onChange={handleChange}
                    />

                    <input
                        name="map"
                        placeholder="Google Maps link"
                        value={form.map}
                        onChange={handleChange}
                    />

                    <textarea
                        name="description"
                        placeholder="Mô tả"
                        value={form.description}
                        onChange={handleChange}
                    />

                    {/* PREVIEW IMAGE */}

                    {form.image && (

                        <img
                            className="preview-image"
                            src={form.image}
                            alt=""
                        />

                    )}

                    {/* SUBMIT */}

                    <button
                        type="submit"
                    >

                        {editingPlace
                            ? "Lưu thay đổi"
                            : "Thêm địa điểm"}

                    </button>

                </form>

            </div>

        </div>
    );
}
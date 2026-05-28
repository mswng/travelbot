import "./PlaceManagement.scss";

import { useState } from "react";

import { Plus } from "lucide-react";

import PlaceCard
from "~/components/admin/places/PlaceCard/PlaceCard.jsx";

import PlaceModal
from "~/components/admin/places/PlaceModal/PlaceModal.jsx";

export default function PlaceManagement() {

    const [places, setPlaces] = useState([

        {
            id: 1,

            title: "Bali",

            image:
                "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?q=80&w=1200",

            location: "Indonesia",

            openTime: "08:00 - 22:00",

            price: "$20",

            description:
                "Beautiful tropical island with beaches and temples.",

            map:
                "https://maps.google.com",
        },

        {
            id: 2,

            title: "Da Lat",

            image:
                "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200",

            location: "Vietnam",

            openTime: "All Day",

            price: "Free",

            description:
                "Romantic city with cool weather and pine forests.",

            map:
                "https://maps.google.com",
        },
    ]);

    /* MODAL */

    const [openModal, setOpenModal] = useState(false);

    const [editingPlace, setEditingPlace] = useState(null);

    /* ADD */

    const handleAdd = (newPlace) => {

        setPlaces((prev) => [

            ...prev,

            {
                ...newPlace,

                id: Date.now(),
            },
        ]);
    };

    /* DELETE */

    const handleDelete = (id) => {

        const confirmDelete = window.confirm(
            "Delete this place?"
        );

        if (!confirmDelete) return;

        setPlaces((prev) =>
            prev.filter((place) => place.id !== id)
        );
    };

    /* EDIT */

    const handleEdit = (place) => {

        setEditingPlace(place);

        setOpenModal(true);
    };

    /* UPDATE */

    const handleUpdate = (updatedPlace) => {

        setPlaces((prev) =>

            prev.map((place) =>

                place.id === updatedPlace.id
                    ? updatedPlace
                    : place
            )
        );
    };

    return (

        <div className="place-page">

            {/* TOP */}

            <div className="place-top">

                <div>

                    <h1>
                        Quản lý địa điểm
                    </h1>

                    <p>
                        Quản lý các điểm đến và địa điểm du lịch.
                    </p>

                </div>

                <button
                    className="add-place-btn"
                    onClick={() => {

                        setEditingPlace(null);

                        setOpenModal(true);
                    }}
                >

                    <Plus size={18} />

                    Thêm địa điểm

                </button>

            </div>

            {/* GRID */}

            <div className="place-grid">

                {places.map((place) => (

                    <PlaceCard
                        key={place.id}
                        place={place}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                    />

                ))}

            </div>

            {/* MODAL */}

            <PlaceModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                onAdd={handleAdd}
                onUpdate={handleUpdate}
                editingPlace={editingPlace}
            />

        </div>
    );
}
import "./PlaceManagement.scss";

import {
    useEffect,
    useState,
} from "react";

import { Plus } from "lucide-react";

import PlaceCard
from "~/components/admin/places/PlaceCard/PlaceCard.jsx";

import PlaceModal
from "~/components/admin/places/PlaceModal/PlaceModal.jsx";

import {
    createPlace,
    deletePlace,
    getPlaces,
    updatePlace,
} from "~/services/adminService";

import {
    unwrapPageContent,
} from "~/services/apiUtils";

export default function PlaceManagement() {

    const [places, setPlaces] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    useEffect(() => {

        fetchPlaces();

    }, []);

    const fetchPlaces = async () => {

        try {

            setLoading(true);
            setError("");

            const data = await getPlaces(0, 10);

            setPlaces(unwrapPageContent(data));

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Không tải được danh sách địa điểm"
            );

        } finally {

            setLoading(false);
        }
    };

    const toPlaceRequest = (place) => ({
        name: place.name || place.title,
        address: place.address || place.location,
        city: place.city,
        country: place.country,
        description: place.description,
        openingHours: place.openingHours || place.openTime,
        priceRange: place.priceRange || place.price,
        website: place.website || place.map,
        placeType: place.placeType,
        rating: place.rating,
        source: place.source || "admin",
    });

    /* MODAL */

    const [openModal, setOpenModal] = useState(false);

    const [editingPlace, setEditingPlace] = useState(null);

    /* ADD */

    const handleAdd = async (newPlace) => {

        await createPlace(toPlaceRequest(newPlace));

        fetchPlaces();
    };

    /* DELETE */

    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(
            "Delete this place?"
        );

        if (!confirmDelete) return;

        await deletePlace(id);

        fetchPlaces();
    };

    /* EDIT */

    const handleEdit = (place) => {

        setEditingPlace(place);

        setOpenModal(true);
    };

    /* UPDATE */

    const handleUpdate = async (updatedPlace) => {

        await updatePlace(
            updatedPlace.id,
            toPlaceRequest(updatedPlace)
        );

        fetchPlaces();
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

            {loading && (
                <p>Đang tải địa điểm...</p>
            )}

            {error && (
                <p>{error}</p>
            )}

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

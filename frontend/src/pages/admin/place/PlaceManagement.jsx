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

import Pagination from "~/components/pagination/pagination.jsx";

import {
    createPlace,
    deletePlace,
    getPlaces,
    updatePlace,
} from "~/services/adminService";

import {
    getPageMeta,
    unwrapPageContent,
} from "~/services/apiUtils";

const PLACES_PER_PAGE = 30;

export default function PlaceManagement() {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageMeta, setPageMeta] = useState({
        totalElements: 0,
        totalPages: 1,
    });

    const [openModal, setOpenModal] = useState(false);
    const [editingPlace, setEditingPlace] = useState(null);

    useEffect(() => {
        fetchPlaces(currentPage);
    }, [currentPage]);

    const fetchPlaces = async (page = currentPage) => {
        try {
            setLoading(true);
            setError("");

            const data = await getPlaces(page - 1, PLACES_PER_PAGE);

            setPlaces(unwrapPageContent(data));
            setPageMeta(getPageMeta(data));
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

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handleAdd = async (newPlace) => {
        await createPlace(toPlaceRequest(newPlace));

        if (currentPage === 1) {
            fetchPlaces(1);
        } else {
            setCurrentPage(1);
        }
    };

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Bạn có chắc muốn xóa địa điểm này?"
        );

        if (!confirmDelete) return;

        await deletePlace(id);

        if (places.length === 1 && currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        } else {
            fetchPlaces(currentPage);
        }
    };

    const handleEdit = (place) => {
        setEditingPlace(place);
        setOpenModal(true);
    };

    const handleUpdate = async (updatedPlace) => {
        await updatePlace(
            updatedPlace.id,
            toPlaceRequest(updatedPlace)
        );

        fetchPlaces(currentPage);
    };

    return (
        <div className="place-page">
            <div className="place-top">
                <div>
                    <h1>
                        Quản lý địa điểm
                    </h1>

                    <p>
                        Đang có {pageMeta.totalElements || 0} địa điểm, mỗi trang hiển thị {PLACES_PER_PAGE} địa điểm.
                    </p>
                </div>

                <button
                    className="add-place-btn"
                    type="button"
                    onClick={() => {
                        setEditingPlace(null);
                        setOpenModal(true);
                    }}
                >
                    <Plus size={18} />
                    Thêm địa điểm
                </button>
            </div>

            {loading && (
                <p>Đang tải địa điểm...</p>
            )}

            {error && (
                <p>{error}</p>
            )}

            {!loading && !error && (
                <>
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

                    <Pagination
                        currentPage={currentPage}
                        totalPages={pageMeta.totalPages || 1}
                        onPageChange={handlePageChange}
                    />
                </>
            )}

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

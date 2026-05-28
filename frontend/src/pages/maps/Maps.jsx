import "./Maps.scss";

import {
    GoogleMap,
    LoadScript,
    Marker,
} from "@react-google-maps/api";

const center = {
    lat: 10.8231,
    lng: 106.6297,
};

const locations = [
    {
        id: 1,
        name: "Nhà thờ Đức Bà",
        lat: 10.7798,
        lng: 106.699,
    },
    {
        id: 2,
        name: "Landmark 81",
        lat: 10.795,
        lng: 106.7218,
    },
];

export default function Maps() {

    return (
        <div className="maps-page">

            <LoadScript googleMapsApiKey="YOUR_API_KEY">

                <GoogleMap
                    mapContainerClassName="map-container"
                    center={center}
                    zoom={12}
                >

                    {locations.map((location) => (
                        <Marker
                            key={location.id}
                            position={{
                                lat: location.lat,
                                lng: location.lng,
                            }}
                        />
                    ))}

                </GoogleMap>

            </LoadScript>

        </div>
    );
}
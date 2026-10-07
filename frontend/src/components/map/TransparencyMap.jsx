import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function formatCurrency(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function TransparencyMap({ institutions, onSelect }) {
  return (
    <MapContainer
      center={[-24.5, -51.5]}
      zoom={7}
      className="h-[500px] w-full rounded-2xl"
      aria-label="Mapa de instituições beneficiadas"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {institutions.map((institution) => (
        <Marker
          key={institution.id}
          position={[institution.latitude, institution.longitude]}
          eventHandlers={{
            click: () => onSelect(institution),
          }}
        >
          <Popup>
            <strong>{institution.name}</strong>
            <br />
            {institution.city} - {institution.state}
            <br />
            Valor demonstrativo: {formatCurrency(institution.amount)}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

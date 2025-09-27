import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  center: [number, number];
  zoom?: number;
  marker?: {
    position: [number, number];
    popupText?: string;
  };
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
  clickable?: boolean;
}

// Component to handle map clicks
const MapClickHandler: React.FC<{ onLocationSelect: (lat: number, lng: number) => void }> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
};

const MapView: React.FC<MapViewProps> = ({
  center,
  zoom = 14,
  marker,
  onLocationSelect,
  height = '400px',
  className = '',
  clickable = true,
}) => {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedPosition([lat, lng]);
    if (onLocationSelect) {
      onLocationSelect(lat, lng);
    }
  };

  // Use marker position or selected position for display
  const displayPosition = marker?.position || selectedPosition || center;

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg border border-gray-300"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Marker for provided position or selected position */}
        {displayPosition && (
          <Marker position={displayPosition}>
            {marker?.popupText && (
              <Popup>
                <div className="text-sm">
                  {marker.popupText}
                </div>
              </Popup>
            )}
          </Marker>
        )}

        {/* Click handler for location selection */}
        {clickable && onLocationSelect && (
          <MapClickHandler onLocationSelect={handleLocationSelect} />
        )}
      </MapContainer>
      
      {/* Instructions overlay */}
      {clickable && onLocationSelect && (
        <div className="absolute top-2 left-2 bg-white bg-opacity-90 px-3 py-2 rounded-md shadow-md text-sm text-gray-700 z-[1000]">
          <i className="fas fa-mouse-pointer mr-2"></i>
          Click on the map to select location
        </div>
      )}
    </div>
  );
};

export default MapView;
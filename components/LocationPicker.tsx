import React, { useState, useEffect, useRef } from 'react';

interface Location {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface LocationPickerProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
  className?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ 
  onLocationSelect, 
  initialLocation, 
  className = '' 
}) => {
  const [location, setLocation] = useState<Location | null>(initialLocation || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY'}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => setError('Failed to load Google Maps');
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const defaultLocation = { lat: 9.9312, lng: 76.2673 }; // Kerala, India
    const initialLatLng = location 
      ? { lat: location.latitude, lng: location.longitude }
      : defaultLocation;

    const map = new window.google.maps.Map(mapRef.current, {
      center: initialLatLng,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapInstanceRef.current = map;

    // Add marker
    const marker = new window.google.maps.Marker({
      position: initialLatLng,
      map: map,
      draggable: true,
      title: 'Drag to set your location'
    });

    markerRef.current = marker;

    // Add click listener to map
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        updateMarkerPosition(e.latLng);
      }
    });

    // Add drag listener to marker
    marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        updateMarkerPosition(e.latLng);
      }
    });

    // If we have an initial location, get its address
    if (location) {
      getAddressFromCoordinates(location.latitude, location.longitude);
    }
  };

  const updateMarkerPosition = (latLng: google.maps.LatLng) => {
    if (markerRef.current) {
      markerRef.current.setPosition(latLng);
      getAddressFromCoordinates(latLng.lat(), latLng.lng());
    }
  };

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    setIsLoading(true);
    setError('');

    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });

      if (response.results[0]) {
        const formattedAddress = response.results[0].formatted_address;
        const newLocation: Location = {
          latitude: lat,
          longitude: lng,
          formattedAddress
        };

        setLocation(newLocation);
        onLocationSelect(newLocation);
      } else {
        setError('Could not find address for this location');
      }
    } catch (err) {
      setError('Failed to get address for this location');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current && markerRef.current) {
          const latLng = new window.google.maps.LatLng(latitude, longitude);
          mapInstanceRef.current.setCenter(latLng);
          updateMarkerPosition(latLng);
        }
      },
      (error) => {
        setError('Unable to get your current location');
        setIsLoading(false);
      }
    );
  };

  const searchLocation = () => {
    if (!mapInstanceRef.current) return;

    const input = document.createElement('input');
    input.placeholder = 'Search for a location...';
    input.className = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

    const searchBox = new window.google.maps.places.SearchBox(input);

    searchBox.addListener('places_changed', () => {
      const places = searchBox.getPlaces();
      if (places.length === 0) return;

      const place = places[0];
      if (!place.geometry || !place.geometry.location) return;

      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setCenter(place.geometry.location);
        updateMarkerPosition(place.geometry.location);
      }
    });

    // Create a modal or use existing UI to show search input
    const searchContainer = document.createElement('div');
    searchContainer.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white p-4 rounded-lg shadow-lg';
    searchContainer.appendChild(input);
    document.body.appendChild(searchContainer);

    input.focus();

    // Remove search container after selection
    setTimeout(() => {
      if (document.body.contains(searchContainer)) {
        document.body.removeChild(searchContainer);
      }
    }, 10000);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Container */}
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-64 rounded-xl border-2 border-gray-200 shadow-sm"
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <i className="fas fa-location-arrow mr-2"></i>
          Use Current Location
        </button>
        
        <button
          type="button"
          onClick={searchLocation}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <i className="fas fa-search mr-2"></i>
          Search Location
        </button>
      </div>

      {/* Selected Location Display */}
      {location && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Selected Location:</h4>
          <p className="text-gray-700 text-sm mb-2">{location.formattedAddress}</p>
          <p className="text-gray-500 text-xs">
            Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-blue-700 text-sm">
          <i className="fas fa-info-circle mr-2"></i>
          Click on the map or drag the marker to set your location. You can also use your current location or search for a specific place.
        </p>
      </div>
    </div>
  );
};

export default LocationPicker; 
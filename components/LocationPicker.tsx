import React, { useState, useEffect, useRef } from 'react';
import { config } from '../src/config/config';

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
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    // Check if Google Maps API key is available
    if (!config.GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key is not configured. Please contact the administrator.');
      return;
    }

    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${config.GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setTimeout(() => {
          if (window.google && window.google.maps) {
            initializeMap();
          } else {
            setError('Google Maps failed to load properly. Please refresh the page.');
          }
        }, 100);
      };
      script.onerror = () => setError('Failed to load Google Maps. Please check your internet connection.');
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

  const handleManualLocationSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      setError('Please enter valid coordinates');
      return;
    }
    
    if (lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }
    
    if (lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }
    
    const newLocation: Location = {
      latitude: lat,
      longitude: lng,
      formattedAddress: `Manual Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`
    };
    
    setLocation(newLocation);
    onLocationSelect(newLocation);
    setShowManualInput(false);
    setError('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Container */}
      <div className="relative">
        {error ? (
          // Fallback UI when Google Maps fails to load
          <div className="w-full h-64 rounded-xl border-2 border-gray-200 shadow-sm bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-4xl mb-4">
                <i className="fas fa-map-marked-alt"></i>
              </div>
              <p className="text-gray-600 font-medium mb-2">Location Picker Unavailable</p>
              <p className="text-gray-500 text-sm mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-redo mr-2"></i>
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={mapRef}
            className="w-full h-64 rounded-xl border-2 border-gray-200 shadow-sm"
          />
        )}
        
        {/* Loading Overlay */}
        {isLoading && !error && (
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
          disabled={isLoading || !!error}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <i className="fas fa-location-arrow mr-2"></i>
          Use Current Location
        </button>
        
        <button
          type="button"
          onClick={searchLocation}
          disabled={isLoading || !!error}
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

      {/* Manual Location Input (when Google Maps is not available) */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-3">Manual Location Input</h4>
          <p className="text-yellow-700 text-sm mb-4">
            Since Google Maps is not available, you can manually enter your coordinates:
          </p>
          
          {!showManualInput ? (
            <button
              onClick={() => setShowManualInput(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <i className="fas fa-edit mr-2"></i>
              Enter Coordinates Manually
            </button>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-yellow-800 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    placeholder="e.g., 9.9312"
                    className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-yellow-800 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    placeholder="e.g., 76.2673"
                    className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleManualLocationSubmit}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <i className="fas fa-check mr-2"></i>
                  Set Location
                </button>
                <button
                  onClick={() => setShowManualInput(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-blue-700 text-sm">
          <i className="fas fa-info-circle mr-2"></i>
          {error ? 
            'Google Maps is currently unavailable. You can manually enter your coordinates above.' :
            'Click on the map or drag the marker to set your location. You can also use your current location or search for a specific place.'
          }
        </p>
      </div>
    </div>
  );
};

export default LocationPicker; 
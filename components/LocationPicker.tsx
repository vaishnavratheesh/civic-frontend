import React, { useState, useEffect } from 'react';
import MapView from './MapView';

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
  const [permissionStatus, setPermissionStatus] = useState<string>('');

  // Default center for Erumeli Panchayat
  const defaultCenter: [number, number] = [9.45, 76.90];

  // Check location permission status on component mount
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state);
        console.log('Geolocation permission:', result.state);
      }).catch(() => {
        console.log('Permission API not supported');
      });
    }
  }, []);

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        }
      });
      if (!res.ok) throw new Error('Reverse geocoding failed');
      const data = await res.json();
      const name = data?.display_name as string | undefined;
      return name && name.trim().length > 0
        ? name
        : `Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    } catch (_) {
      return `Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`;
    }
  };

  const handleLocationSelect = async (lat: number, lng: number) => {
    setIsLoading(true);
    setError('');

    const address = await reverseGeocode(lat, lng);
    
    const newLocation: Location = {
      latitude: lat,
      longitude: lng,
      formattedAddress: address
    };

    setLocation(newLocation);
    onLocationSelect(newLocation);
    setIsLoading(false);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    // Check if we're on HTTPS or localhost (required for geolocation)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setError('Location access requires a secure connection (HTTPS). Please use the map or enter coordinates manually.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Enhanced geolocation options
    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds timeout
      maximumAge: 300000 // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Location obtained:', { latitude, longitude });
        handleLocationSelect(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your current location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access was denied. Please enable location permissions in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable. Please try again or enter coordinates manually.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again or enter coordinates manually.';
            break;
          default:
            errorMessage += 'An unknown error occurred. Please try again or enter coordinates manually.';
            break;
        }
        
        setError(errorMessage);
        setIsLoading(false);
      },
      options
    );
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
    
    handleLocationSelect(lat, lng);
    setShowManualInput(false);
    setError('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Container */}
      <div className="relative">
        <MapView
          center={location ? [location.latitude, location.longitude] : defaultCenter}
          zoom={15}
          marker={location ? {
            position: [location.latitude, location.longitude],
            popupText: location.formattedAddress
          } : undefined}
          onLocationSelect={handleLocationSelect}
          height="400px"
          clickable={true}
        />
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
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
          onClick={() => setShowManualInput(!showManualInput)}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <i className="fas fa-edit mr-2"></i>
          {showManualInput ? 'Hide Manual Input' : 'Enter Coordinates'}
        </button>
      </div>

      {/* Manual Location Input */}
      {showManualInput && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-3">Manual Location Input</h4>
          <p className="text-yellow-700 text-sm mb-4">
            Enter your coordinates manually:
          </p>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-yellow-800 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="e.g., 9.45"
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
                  placeholder="e.g., 76.90"
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
        </div>
      )}

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

      {/* Permission Status and Instructions */}
      <div className="space-y-3">
        {permissionStatus === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm font-medium mb-2">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Location Access Blocked
            </p>
            <p className="text-red-600 text-sm mb-2">
              Location access has been blocked for this site. To enable it:
            </p>
            <ul className="text-red-600 text-sm list-disc list-inside space-y-1">
              <li><strong>Chrome/Edge:</strong> Click the location icon in the address bar and select "Allow"</li>
              <li><strong>Firefox:</strong> Click the shield icon and enable location sharing</li>
              <li><strong>Safari:</strong> Go to Safari → Settings → Websites → Location and allow this site</li>
            </ul>
            <p className="text-red-600 text-sm mt-2">
              Alternatively, you can click on the map or enter coordinates manually.
            </p>
          </div>
        )}

        {permissionStatus === 'prompt' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-700 text-sm">
              <i className="fas fa-info-circle mr-2"></i>
              Click "Use Current Location" and allow location access when prompted by your browser.
            </p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-700 text-sm font-medium mb-2">
            <i className="fas fa-map-marker-alt mr-2"></i>
            How to select your location:
          </p>
          <ul className="text-blue-600 text-sm list-disc list-inside space-y-1">
            <li><strong>Automatic:</strong> Click "Use Current Location" (requires location permission)</li>
            <li><strong>Manual:</strong> Click anywhere on the map to select that location</li>
            <li><strong>Coordinates:</strong> Use "Enter Coordinates" if you know the exact lat/lng</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker; 
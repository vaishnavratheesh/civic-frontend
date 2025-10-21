import React, { useState, useEffect } from 'react';

const LocationDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const info: any = {
      geolocationSupported: 'geolocation' in navigator,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      isSecure: window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
      userAgent: navigator.userAgent,
      permissionsAPI: 'permissions' in navigator
    };

    // Check permission status if available
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        info.permissionStatus = result.state;
        setDebugInfo(info);
      }).catch(() => {
        info.permissionStatus = 'unknown';
        setDebugInfo(info);
      });
    } else {
      info.permissionStatus = 'not supported';
      setDebugInfo(info);
    }
  }, []);

  const testGeolocation = () => {
    setTesting(true);
    
    if (!navigator.geolocation) {
      setDebugInfo(prev => ({ ...prev, testResult: 'Geolocation not supported' }));
      setTesting(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDebugInfo(prev => ({
          ...prev,
          testResult: 'Success',
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
        }));
        setTesting(false);
      },
      (error) => {
        let errorMsg = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Position unavailable';
            break;
          case error.TIMEOUT:
            errorMsg = 'Timeout';
            break;
          default:
            errorMsg = 'Unknown error';
            break;
        }
        
        setDebugInfo(prev => ({
          ...prev,
          testResult: `Error: ${errorMsg}`,
          errorCode: error.code,
          errorMessage: error.message
        }));
        setTesting(false);
      },
      options
    );
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-2xl">
      <h3 className="font-bold text-lg mb-4">Location Access Debug Information</h3>
      
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Geolocation Supported:</strong>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${debugInfo.geolocationSupported ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {debugInfo.geolocationSupported ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div>
            <strong>Secure Context:</strong>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${debugInfo.isSecure ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {debugInfo.isSecure ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div>
            <strong>Protocol:</strong>
            <span className="ml-2 font-mono">{debugInfo.protocol}</span>
          </div>
          
          <div>
            <strong>Hostname:</strong>
            <span className="ml-2 font-mono">{debugInfo.hostname}</span>
          </div>
          
          <div>
            <strong>Permission Status:</strong>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${
              debugInfo.permissionStatus === 'granted' ? 'bg-green-100 text-green-800' :
              debugInfo.permissionStatus === 'denied' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {debugInfo.permissionStatus}
            </span>
          </div>
          
          <div>
            <strong>Permissions API:</strong>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${debugInfo.permissionsAPI ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {debugInfo.permissionsAPI ? 'Supported' : 'Not Supported'}
            </span>
          </div>
        </div>

        <div>
          <strong>User Agent:</strong>
          <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono break-all">
            {debugInfo.userAgent}
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center justify-between mb-2">
            <strong>Geolocation Test:</strong>
            <button
              onClick={testGeolocation}
              disabled={testing || !debugInfo.geolocationSupported}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test Location Access'}
            </button>
          </div>
          
          {debugInfo.testResult && (
            <div className={`p-2 rounded text-xs ${
              debugInfo.testResult === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <strong>Result:</strong> {debugInfo.testResult}
              
              {debugInfo.coordinates && (
                <div className="mt-1">
                  <div>Latitude: {debugInfo.coordinates.latitude}</div>
                  <div>Longitude: {debugInfo.coordinates.longitude}</div>
                  <div>Accuracy: {debugInfo.coordinates.accuracy}m</div>
                </div>
              )}
              
              {debugInfo.errorCode && (
                <div className="mt-1">
                  <div>Error Code: {debugInfo.errorCode}</div>
                  <div>Error Message: {debugInfo.errorMessage}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <strong>Quick Fixes:</strong>
        <ul className="mt-1 list-disc list-inside space-y-1 text-blue-700">
          {!debugInfo.isSecure && (
            <li>Enable HTTPS - Geolocation requires a secure connection</li>
          )}
          {debugInfo.permissionStatus === 'denied' && (
            <li>Click the location icon in your address bar and allow location access</li>
          )}
          {debugInfo.permissionStatus === 'prompt' && (
            <li>Click "Test Location Access" and allow when prompted</li>
          )}
          <li>Try refreshing the page after changing permissions</li>
          <li>Use manual coordinate input or map clicking as alternatives</li>
        </ul>
      </div>
    </div>
  );
};

export default LocationDebugger;
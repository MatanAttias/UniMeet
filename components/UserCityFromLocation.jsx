import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

const UserCityFromLocation = ({ location }) => {
  const [city, setCity] = useState(null);

  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;

    const fetchCity = async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`;
        console.log('📍 fetchCity started:', url);

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'UniMeetApp/1.0 (1maorhuri1@gmail.com)',
          },
        });

        console.log('📍 fetchCity response status:', response.status);

        const data = await response.json();
        console.log('📍 fetchCity data:', data);

        const cityName =
          data?.address?.city ||
          data?.address?.town ||
          data?.address?.village ||
          data?.address?.county;

        setCity(cityName || 'לא נמצאה עיר');
      } catch (err) {
        console.error('❌ fetchCity failed:', err);
        setCity('שגיאה בקבלת מיקום');
      }
    };

    fetchCity();
  }, [location]);

  return <Text style={{ color: 'gray' }}>{city || 'טוען מיקום...'}</Text>;
};

export default UserCityFromLocation;
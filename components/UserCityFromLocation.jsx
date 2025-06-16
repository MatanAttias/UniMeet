import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

const UserCityFromLocation = ({ location }) => {
  const [city, setCity] = useState(null);

  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;

    const fetchCity = async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'UniMeetApp/1.0 (1maorhuri1@gmail.com)', 
          },
        });
        const data = await response.json();
        const cityName =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.county;

        setCity(cityName || 'לא נמצאה עיר');
      } catch (err) {
        console.error('שגיאה בקבלת עיר:', err);
        setCity('שגיאה בקבלת מיקום');
      }
    };

    fetchCity();
  }, [location]);

  return <Text style={{ color: 'gray' }}>{city || 'טוען מיקום...'}</Text>;
};

export default UserCityFromLocation;
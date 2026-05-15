const axios = require('axios');
const env = require('../config/env');

const BASE_URL = 'https://maps.googleapis.com/maps/api';
const getApiKey = () => {
  const apiKey = env.googleMaps?.apiKey;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY no configurada en variables de entorno');
  }
  return apiKey;
};

const geocodeAddress = async (address, region = 'CO') => {
  if (!address) {
    throw new Error('La dirección es requerida para geocodificar');
  }

  try {
    const response = await axios.get(`${BASE_URL}/geocode/json`, {
      params: {
        address: address,
        region: region,
        key: getApiKey()
      }
    });

    if (response.data.status === 'ZERO_RESULTS') {
      throw new Error('No se encontraron resultados para la dirección');
    }

    if (response.data.status !== 'OK') {
      throw new Error(`Error de Google Maps: ${response.data.status}`);
    }

    const result = response.data.results[0];
    const location = result.geometry.location;

    const addressComponents = result.address_components;
    let department = null;
    let municipality = null;

    for (const component of addressComponents) {
      if (component.types.includes('administrative_area_level_1')) {
        department = component.long_name;
      }
      if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
        municipality = component.long_name;
      }
    }

    return {
      latitude: location.lat,
      longitude: location.lng,
      formatted_address: result.formatted_address,
      department: department,
      municipality: municipality,
      place_id: result.place_id
    };
  } catch (error) {
    if (error.message.includes('GOOGLE_MAPS_API_KEY')) {
      throw error;
    }
    throw new Error(`Error al geocodificar dirección: ${error.message}`);
  }
};

const reverseGeocode = async (latitude, longitude) => {
  if (!latitude || !longitude) {
    throw new Error('Latitud y longitud son requeridas');
  }

  try {
    const response = await axios.get(`${BASE_URL}/geocode/json`, {
      params: {
        latlng: `${latitude},${longitude}`,
        result_type: 'street_address|route|locality|administrative_area_level_2',
        key: getApiKey()
      }
    });

    if (response.data.status === 'ZERO_RESULTS') {
      return {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        formatted_address: null,
        department: null,
        municipality: null
      };
    }

    const result = response.data.results[0] || {};
    const addressComponents = result.address_components || [];
    let department = null;
    let municipality = null;

    for (const component of addressComponents) {
      if (component.types.includes('administrative_area_level_1')) {
        department = component.long_name;
      }
      if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
        municipality = component.long_name;
      }
    }

    return {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      formatted_address: result.formatted_address || null,
      department: department,
      municipality: municipality,
      place_id: result.place_id || null
    };
  } catch (error) {
    if (error.message.includes('GOOGLE_MAPS_API_KEY')) {
      throw error;
    }
    throw new Error(`Error al reverse geocodificar: ${error.message}`);
  }
};

const getPlaceDetails = async (placeId) => {
  if (!placeId) {
    throw new Error('Place ID es requerido');
  }

  try {
    const response = await axios.get(`${BASE_URL}/place/details/json`, {
      params: {
        place_id: placeId,
        fields: 'geometry,formatted_address,address_components',
        key: getApiKey()
      }
    });

    if (response.data.status !== 'OK') {
      throw new Error(`Error de Google Maps: ${response.data.status}`);
    }

    const result = response.data.result;
    const location = result.geometry.location;

    const addressComponents = result.address_components;
    let department = null;
    let municipality = null;

    for (const component of addressComponents) {
      if (component.types.includes('administrative_area_level_1')) {
        department = component.long_name;
      }
      if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
        municipality = component.long_name;
      }
    }

    return {
      latitude: location.lat,
      longitude: location.lng,
      formatted_address: result.formatted_address,
      department: department,
      municipality: municipality
    };
  } catch (error) {
    if (error.message.includes('GOOGLE_MAPS_API_KEY')) {
      throw error;
    }
    throw new Error(`Error al obtener detalles del lugar: ${error.message}`);
  }
};

const isWithinColombia = (latitude, longitude) => {
  const colBounds = {
    minLat: -4.2,
    maxLat: 12.5,
    minLng: -82.0,
    minLng: -66.8
  };

  return (
    latitude >= colBounds.minLat &&
    latitude <= colBounds.maxLat &&
    longitude >= colBounds.minLng &&
    longitude <= colBounds.minLng
  );
};

module.exports = {
  geocodeAddress,
  reverseGeocode,
  getPlaceDetails,
  isWithinColombia
};
import { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  useMapEvents,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-terminator';
import './App.css';

interface Weather {
  temperature: number;
  windspeed: number;
  time: string;
}

async function fetchCity(lat: number, lon: number): Promise<string | null> {
  try {
    const resp = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1`
    );
    const data = await resp.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].name as string;
    }
  } catch (err) {
    console.error('Failed to load city name', err);
  }
  return null;
}

async function fetchWeather(lat: number, lon: number): Promise<Weather | null> {
  try {
    const resp = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,windspeed_10m&timezone=auto`
    );
    const data = await resp.json();
    const current = data.current;
    if (current) {
      return {
        temperature: current.temperature_2m,
        windspeed: current.windspeed_10m,
        time: current.time,
      };
    }
  } catch (err) {
    console.error('Failed to load weather', err);
  }
  return null;
}

const position: [number, number] = [0, 0];

function DayNight() {
  const map = useMap();
  useEffect(() => {
    // leaflet-terminator has no types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const term = (L as any).terminator();
    term.addTo(map);
    const id = setInterval(() => {
      term.setTime();
      term.redraw();
    }, 600000); // update every 10 minutes
    return () => {
      map.removeLayer(term);
      clearInterval(id);
    };
  }, [map]);
  return null;
}

function WeatherMarker({ onWeather }: { onWeather: (w: Weather, city: string | null, lat: number, lon: number) => void }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      const [data, city] = await Promise.all([fetchWeather(lat, lng), fetchCity(lat, lng)]);
      if (data) {
        onWeather(data, city, lat, lng);
      }
    },
  });
  return null;
}

function App() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!markerPos) return;
    const [lat, lon] = markerPos;
    let cancelled = false;
    const update = async () => {
      const w = await fetchWeather(lat, lon);
      if (w && !cancelled) {
        setWeather(w);
      }
    };
    update();
    const id = setInterval(update, 300000); // refresh every 5 minutes
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [markerPos]);

  return (
    <div className="app">
      <MapContainer center={position} zoom={2} className="map">
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <DayNight />
        <WeatherMarker
          onWeather={(w, c, lat, lon) => {
            setWeather(w);
            setCity(c);
            setMarkerPos([lat, lon]);
          }}
        />
        {markerPos && weather && (
          <Marker
            position={markerPos}
            icon={L.icon({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            })}
          >
            <Popup>
              <div className="glass card">
                {city && <div className="city">{city}</div>}
                <div>🌡️ {weather.temperature}&deg;C</div>
                <div>🌬️ {weather.windspeed} km/h</div>
                <div>{weather.time}</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      <div className="instructions">Click on the map to view live weather. Data updates every 5 minutes.</div>
      <div className="footer">Solora © 2025</div>
    </div>
  );
}

export default App;

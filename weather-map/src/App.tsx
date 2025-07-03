import { useState } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

interface Weather {
  temperature: number;
  windspeed: number;
  time: string;
}

const position: [number, number] = [0, 0];

function WeatherMarker({ onWeather }: { onWeather: (w: Weather, lat: number, lon: number) => void }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      try {
        const resp = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,windspeed_10m&timezone=auto`
        );
        const data = await resp.json();
        const current = data.current;
        if (current) {
          onWeather(
            {
              temperature: current.temperature_2m,
              windspeed: current.windspeed_10m,
              time: current.time,
            },
            lat,
            lng
          );
        }
      } catch (err) {
        console.error('Failed to load weather', err);
      }
    },
  });
  return null;
}

function App() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);

  return (
    <div className="app">
      <MapContainer center={position} zoom={2} className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <WeatherMarker
          onWeather={(w, lat, lon) => {
            setWeather(w);
            setMarkerPos([lat, lon]);
          }}
        />
        {markerPos && weather && (
          <Marker position={markerPos} icon={L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] })}>
            <Popup>
              <div>
                <div>🌡️ {weather.temperature}&deg;C</div>
                <div>🌬️ {weather.windspeed} km/h</div>
                <div>{weather.time}</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
      <div className="instructions">Click anywhere on the map to fetch current weather.</div>
    </div>
  );
}

export default App;

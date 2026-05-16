import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Building2, Activity, Zap, TrendingUp } from 'lucide-react';

// Fix for default marker icons in Leaflet + React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom Premium Marker
const createCustomIcon = (status) => {
  const color = status === 'ACTIVE' ? '#a0522d' : '#475569';
  const glowColor = status === 'ACTIVE' ? 'rgba(160, 82, 45, 0.4)' : 'rgba(71, 85, 105, 0.4)';
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        width: 32px; 
        height: 32px; 
        background: rgba(10, 10, 10, 0.8); 
        border: 2px solid ${color}; 
        border-radius: 10px; 
        display: flex; 
        items-center; 
        justify-content: center; 
        box-shadow: 0 0 15px ${glowColor};
        backdrop-filter: blur(4px);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18"/><path d="M9 8h1"/><path d="M9 12h1"/><path d="M9 16h1"/><path d="M14 8h1"/><path d="M14 12h1"/><path d="M14 16h1"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const MapController = ({ gyms }) => {
  const map = useMap();
  React.useEffect(() => {
    if (gyms.length > 0) {
      const bounds = L.latLngBounds(gyms.map(g => [g.latitude, g.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [gyms, map]);
  return null;
};

const NetworkIntelligenceMap = ({ gyms }) => {
  return (
    <div className="w-full h-[450px] rounded-[2rem] overflow-hidden border border-white/[0.08] shadow-2xl relative group">
      {/* Map Overlay for High-End Feel */}
      <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
        <div className="aura-glass px-5 py-3 flex items-center gap-3 border-earth-clay/20 bg-black/40">
          <Zap size={14} className="text-earth-clay animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ivory">Geospatial Intelligence Hub</span>
        </div>
      </div>

      <MapContainer 
        center={[20.5937, 78.9629]} 
        zoom={5} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {gyms.filter(g => g.latitude && g.longitude).map(gym => (
          <Marker 
            key={gym.id} 
            position={[gym.latitude, gym.longitude]}
            icon={createCustomIcon(gym.saas_subscription_status)}
          >
            <Popup className="premium-popup">
              <div className="p-2 min-w-[200px]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-earth-clay/10 border border-earth-clay/20 flex items-center justify-center text-earth-clay">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-ivory leading-none mb-1">{gym.name}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{gym.location}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
                    <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Members</p>
                    <p className="text-xs font-black text-ivory">{gym.total_members || 0}</p>
                  </div>
                  <div className="bg-white/[0.03] p-2 rounded-lg border border-white/[0.05]">
                    <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Revenue</p>
                    <p className="text-xs font-black text-earth-clay">₹{Number(gym.total_revenue || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        <MapController gyms={gyms} />
      </MapContainer>

      {/* Aesthetic Border Glow */}
      <div className="absolute inset-0 border border-white/[0.05] rounded-[2rem] pointer-events-none" />
    </div>
  );
};

export default NetworkIntelligenceMap;

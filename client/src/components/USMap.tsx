import { useMemo, useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StateData {
  state: string;
  stateName: string;
  count: number;
  amount: number;
}

interface USMapProps {
  data: StateData[];
  selectedState: string | null;
  onStateClick: (stateCode: string) => void;
  formatCurrency: (amount: number) => string;
}

interface GeoFeature {
  type: string;
  id: string;
  properties: { name: string };
  geometry: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
}

interface TopoJSON {
  type: string;
  objects: {
    states: {
      type: string;
      geometries: Array<{
        type: string;
        id: string;
        properties: { name: string };
        arcs: number[][] | number[][][];
      }>;
    };
  };
  arcs: number[][][];
  transform: {
    scale: [number, number];
    translate: [number, number];
  };
}

const FIPS_TO_STATE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY", "72": "PR"
};

function decodeArc(arcs: number[][][], arcIndex: number, transform: { scale: [number, number]; translate: [number, number] }): [number, number][] {
  const arc = arcs[arcIndex < 0 ? ~arcIndex : arcIndex];
  const points: [number, number][] = [];
  let x = 0, y = 0;
  
  for (const [dx, dy] of arc) {
    x += dx;
    y += dy;
    const px = x * transform.scale[0] + transform.translate[0];
    const py = y * transform.scale[1] + transform.translate[1];
    points.push([px, py]);
  }
  
  if (arcIndex < 0) {
    points.reverse();
  }
  
  return points;
}

function topoToGeo(topo: TopoJSON): GeoFeature[] {
  const features: GeoFeature[] = [];
  const { arcs, transform, objects } = topo;
  
  for (const geom of objects.states.geometries) {
    const coordinates: number[][][] = [];
    
    if (geom.type === "Polygon") {
      for (const ring of geom.arcs as number[][]) {
        const ringCoords: number[][] = [];
        for (const arcIndex of ring) {
          const arcPoints = decodeArc(arcs, arcIndex, transform);
          ringCoords.push(...arcPoints);
        }
        coordinates.push(ringCoords);
      }
      features.push({
        type: "Feature",
        id: geom.id,
        properties: geom.properties,
        geometry: { type: "Polygon", coordinates }
      });
    } else if (geom.type === "MultiPolygon") {
      const multiCoords: number[][][][] = [];
      for (const polygon of geom.arcs as number[][][]) {
        const polyCoords: number[][][] = [];
        for (const ring of polygon) {
          const ringCoords: number[][] = [];
          for (const arcIndex of ring) {
            const arcPoints = decodeArc(arcs, arcIndex, transform);
            ringCoords.push(...arcPoints);
          }
          polyCoords.push(ringCoords);
        }
        multiCoords.push(polyCoords);
      }
      features.push({
        type: "Feature",
        id: geom.id,
        properties: geom.properties,
        geometry: { type: "MultiPolygon", coordinates: multiCoords }
      });
    }
  }
  
  return features;
}

function geoAlbersUsaProject(lng: number, lat: number): [number, number] | null {
  const toRadians = (d: number) => d * Math.PI / 180;
  
  const lowerLat = toRadians(lat);
  const lowerLng = toRadians(lng);
  
  if (lat > 50 && lng < -130) {
    const centerLng = toRadians(-154);
    const centerLat = toRadians(64);
    const x = (lowerLng - centerLng) * Math.cos(centerLat) * 150;
    const y = -(lowerLat - centerLat) * 150;
    return [150 + x, 480 + y];
  }
  
  if (lat < 25 && lng > -162 && lng < -154) {
    const centerLng = toRadians(-157);
    const centerLat = toRadians(20.5);
    const x = (lowerLng - centerLng) * Math.cos(centerLat) * 400;
    const y = -(lowerLat - centerLat) * 400;
    return [300 + x, 520 + y];
  }
  
  if (lat < 19 && lng > -68 && lng < -65) {
    const centerLng = toRadians(-66.5);
    const centerLat = toRadians(18.2);
    const x = (lowerLng - centerLng) * Math.cos(centerLat) * 600;
    const y = -(lowerLat - centerLat) * 600;
    return [830 + x, 520 + y];
  }
  
  const phi1 = toRadians(29.5);
  const phi2 = toRadians(45.5);
  const phi0 = toRadians(37.5);
  const lambda0 = toRadians(-96);
  
  const n = (Math.sin(phi1) + Math.sin(phi2)) / 2;
  const C = Math.cos(phi1) ** 2 + 2 * n * Math.sin(phi1);
  const rho0 = Math.sqrt(C - 2 * n * Math.sin(phi0)) / n;
  
  const rho = Math.sqrt(C - 2 * n * Math.sin(lowerLat)) / n;
  const theta = n * (lowerLng - lambda0);
  
  const x = rho * Math.sin(theta);
  const y = rho0 - rho * Math.cos(theta);
  
  const scale = 1050;
  const translateX = 480;
  const translateY = 300;
  
  return [x * scale + translateX, y * scale + translateY];
}

function projectCoordinates(coords: number[][]): string {
  const points: string[] = [];
  for (const [lng, lat] of coords) {
    const projected = geoAlbersUsaProject(lng, lat);
    if (projected) {
      points.push(`${projected[0].toFixed(1)},${projected[1].toFixed(1)}`);
    }
  }
  return points.length > 0 ? `M${points.join("L")}Z` : "";
}

function featureToPath(feature: GeoFeature): string {
  const paths: string[] = [];
  
  if (feature.geometry.type === "Polygon") {
    const coords = feature.geometry.coordinates as number[][][];
    for (const ring of coords) {
      const path = projectCoordinates(ring);
      if (path) paths.push(path);
    }
  } else if (feature.geometry.type === "MultiPolygon") {
    const multiCoords = feature.geometry.coordinates as number[][][][];
    for (const polygon of multiCoords) {
      for (const ring of polygon) {
        const path = projectCoordinates(ring);
        if (path) paths.push(path);
      }
    }
  }
  
  return paths.join(" ");
}

export function USMap({ data, selectedState, onStateClick, formatCurrency }: USMapProps) {
  const [features, setFeatures] = useState<GeoFeature[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")
      .then(res => res.json())
      .then((topo: TopoJSON) => {
        const geoFeatures = topoToGeo(topo);
        setFeatures(geoFeatures);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load map data:", err);
        setLoading(false);
      });
  }, []);

  const stateDataMap = useMemo(() => {
    const map: Record<string, StateData> = {};
    data.forEach(d => { map[d.state] = d; });
    return map;
  }, [data]);

  const maxAmount = useMemo(() => {
    return Math.max(...data.map(d => d.amount), 1);
  }, [data]);

  const getColor = (stateCode: string) => {
    const stateData = stateDataMap[stateCode];
    if (!stateData || stateData.amount === 0) return '#e5e7eb';
    
    const intensity = stateData.amount / maxAmount;
    
    if (selectedState === stateCode) {
      return '#0284c7';
    }
    
    if (intensity > 0.7) return '#dc2626';
    if (intensity > 0.5) return '#ea580c';
    if (intensity > 0.3) return '#eab308';
    if (intensity > 0.15) return '#22c55e';
    return '#86efac';
  };

  const getStateName = (fipsCode: string): string => {
    const stateCode = FIPS_TO_STATE[fipsCode];
    if (!stateCode) return fipsCode;
    const stateData = stateDataMap[stateCode];
    return stateData?.stateName || stateCode;
  };

  if (loading) {
    return (
      <div className="map-container flex items-center justify-center">
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="map-container" style={{ width: '100%', maxWidth: '960px', aspectRatio: '960 / 600', margin: '0 auto' }}>
        <svg 
          viewBox="0 0 960 600" 
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <rect width="960" height="600" fill="transparent" />
          
          {features.map(feature => {
            const fipsCode = feature.id;
            const stateCode = FIPS_TO_STATE[fipsCode];
            if (!stateCode) return null;
            
            const stateData = stateDataMap[stateCode];
            const pathD = featureToPath(feature);
            if (!pathD) return null;

            return (
              <Tooltip key={fipsCode}>
                <TooltipTrigger asChild>
                  <path
                    d={pathD}
                    fill={getColor(stateCode)}
                    stroke={selectedState === stateCode ? '#0369a1' : '#9ca3af'}
                    strokeWidth={selectedState === stateCode ? 2 : 0.75}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStateClick(stateCode);
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent className="bg-white border shadow-lg p-3 z-50">
                  <div className="space-y-1">
                    <div className="font-semibold">{getStateName(fipsCode)}</div>
                    <div className="text-sm text-muted-foreground">
                      Variances: {stateData ? stateData.count.toLocaleString() : 0}
                    </div>
                    <div className="text-sm font-medium text-rose-600">
                      Amount: {stateData ? formatCurrency(stateData.amount) : '$0'}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
          
          <g transform="translate(830, 460)">
            <text x="0" y="0" fontSize="11" fontWeight="600" fill="#374151">Variance</text>
            <rect x="0" y="8" width="16" height="12" fill="#dc2626" rx="2" />
            <text x="20" y="18" fontSize="9" fill="#6b7280">Very High</text>
            <rect x="0" y="24" width="16" height="12" fill="#ea580c" rx="2" />
            <text x="20" y="34" fontSize="9" fill="#6b7280">High</text>
            <rect x="0" y="40" width="16" height="12" fill="#eab308" rx="2" />
            <text x="20" y="50" fontSize="9" fill="#6b7280">Medium</text>
            <rect x="0" y="56" width="16" height="12" fill="#22c55e" rx="2" />
            <text x="20" y="66" fontSize="9" fill="#6b7280">Low</text>
            <rect x="0" y="72" width="16" height="12" fill="#86efac" rx="2" />
            <text x="20" y="82" fontSize="9" fill="#6b7280">Very Low</text>
          </g>
        </svg>
      </div>
    </TooltipProvider>
  );
}

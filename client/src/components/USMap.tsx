import { useMemo } from "react";
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

const STATE_PATHS: Record<string, { path: string; x: number; y: number }> = {
  AL: { path: "M628,396 L630,442 L590,445 L585,397 Z", x: 608, y: 420 },
  AZ: { path: "M200,340 L265,350 L250,430 L175,415 L165,350 Z", x: 210, y: 385 },
  CA: { path: "M100,260 L165,280 L175,415 L130,440 L70,360 L80,280 Z", x: 110, y: 350 },
  CO: { path: "M270,290 L370,295 L365,355 L265,350 Z", x: 315, y: 320 },
  FL: { path: "M655,445 L720,455 L740,520 L695,545 L655,490 L640,455 Z", x: 690, y: 485 },
  GA: { path: "M630,395 L680,400 L680,450 L630,445 Z", x: 655, y: 422 },
  IL: { path: "M540,270 L570,275 L575,350 L535,355 L530,290 Z", x: 550, y: 310 },
  IN: { path: "M575,275 L605,280 L600,345 L575,350 Z", x: 585, y: 310 },
  LA: { path: "M535,445 L585,448 L595,485 L545,495 L530,460 Z", x: 555, y: 465 },
  MA: { path: "M755,215 L785,210 L790,230 L760,235 Z", x: 772, y: 222 },
  MD: { path: "M695,295 L740,290 L745,315 L700,320 Z", x: 718, y: 305 },
  MI: { path: "M555,190 L610,185 L620,260 L590,270 L555,250 Z", x: 580, y: 225 },
  MN: { path: "M470,155 L530,150 L535,230 L475,235 Z", x: 500, y: 190 },
  MO: { path: "M475,305 L540,300 L545,370 L480,375 Z", x: 505, y: 335 },
  NC: { path: "M680,350 L760,340 L765,375 L685,390 Z", x: 720, y: 365 },
  NJ: { path: "M735,255 L755,250 L760,290 L740,295 Z", x: 747, y: 272 },
  NY: { path: "M700,195 L760,185 L770,250 L720,260 L695,230 Z", x: 730, y: 220 },
  OH: { path: "M605,265 L650,260 L655,325 L610,330 Z", x: 627, y: 292 },
  PA: { path: "M660,250 L735,240 L740,290 L665,300 Z", x: 695, y: 268 },
  SC: { path: "M680,395 L720,390 L730,430 L685,440 Z", x: 700, y: 415 },
  TN: { path: "M540,360 L660,350 L665,390 L545,400 Z", x: 600, y: 375 },
  TX: { path: "M300,380 L420,370 L450,500 L340,530 L270,470 L280,400 Z", x: 365, y: 445 },
  VA: { path: "M660,310 L740,295 L755,340 L675,355 Z", x: 705, y: 325 },
  WA: { path: "M120,110 L195,105 L200,170 L125,175 Z", x: 155, y: 140 },
  WI: { path: "M510,175 L560,170 L565,245 L515,250 Z", x: 535, y: 210 },
};

const ACTIVE_STATES = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI', 'CO', 'MN', 'SC', 'AL', 'LA'];

export function USMap({ data, selectedState, onStateClick, formatCurrency }: USMapProps) {
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
    if (!stateData) return 'hsl(var(--muted))';
    const intensity = stateData.amount / maxAmount;
    if (selectedState === stateCode) {
      return 'hsl(196, 100%, 37%)';
    }
    if (intensity > 0.7) return 'hsl(12, 76%, 50%)';
    if (intensity > 0.4) return 'hsl(43, 74%, 55%)';
    if (intensity > 0.2) return 'hsl(173, 58%, 50%)';
    return 'hsl(173, 58%, 70%)';
  };

  return (
    <TooltipProvider>
      <svg viewBox="0 0 900 600" className="w-full h-full">
        <rect width="900" height="600" fill="transparent" />
        
        {ACTIVE_STATES.map(stateCode => {
          const pathData = STATE_PATHS[stateCode];
          const stateData = stateDataMap[stateCode];
          if (!pathData) return null;

          return (
            <Tooltip key={stateCode}>
              <TooltipTrigger asChild>
                <g
                  onClick={(e) => {
                    e.stopPropagation();
                    onStateClick(stateCode);
                  }}
                  className="cursor-pointer transition-all duration-200"
                >
                  <path
                    d={pathData.path}
                    fill={getColor(stateCode)}
                    stroke={selectedState === stateCode ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                    strokeWidth={selectedState === stateCode ? 3 : 1}
                    className="hover:opacity-80 transition-opacity"
                  />
                  <text
                    x={pathData.x}
                    y={pathData.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[10px] font-medium fill-white pointer-events-none"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {stateCode}
                  </text>
                </g>
              </TooltipTrigger>
              {stateData && (
                <TooltipContent className="bg-white border shadow-lg p-3">
                  <div className="space-y-1">
                    <div className="font-semibold">{stateData.stateName}</div>
                    <div className="text-sm text-muted-foreground">
                      Variances: {stateData.count.toLocaleString()}
                    </div>
                    <div className="text-sm font-medium text-rose-600">
                      Amount: {formatCurrency(stateData.amount)}
                    </div>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
        
        <g transform="translate(750, 450)">
          <text x="0" y="0" className="text-xs font-medium fill-muted-foreground">Variance Amount</text>
          <rect x="0" y="10" width="20" height="15" fill="hsl(12, 76%, 50%)" />
          <text x="25" y="22" className="text-[10px] fill-muted-foreground">High</text>
          <rect x="0" y="30" width="20" height="15" fill="hsl(43, 74%, 55%)" />
          <text x="25" y="42" className="text-[10px] fill-muted-foreground">Medium</text>
          <rect x="0" y="50" width="20" height="15" fill="hsl(173, 58%, 50%)" />
          <text x="25" y="62" className="text-[10px] fill-muted-foreground">Low</text>
          <rect x="0" y="70" width="20" height="15" fill="hsl(var(--muted))" />
          <text x="25" y="82" className="text-[10px] fill-muted-foreground">No Data</text>
        </g>
      </svg>
    </TooltipProvider>
  );
}

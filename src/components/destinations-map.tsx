type MapPin = {
  id: string;
  title: string;
  lat: number;
  lon: number;
};

export function DestinationsMap({ pins }: { pins: MapPin[] }) {
  if (pins.length === 0) return null;

  return (
    <div className="mb-8 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="relative w-full" style={{ aspectRatio: "4378 / 2435" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/world-map.svg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
        {pins.map((pin) => {
          const left = ((pin.lon + 180) / 360) * 100;
          const top = ((90 - pin.lat) / 180) * 100;
          return (
            <div
              key={pin.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${left}%`, top: `${top}%` }}
              title={pin.title}
            >
              <span className="block h-2.5 w-2.5 rounded-full border-2 border-white bg-accent shadow" />
            </div>
          );
        })}
      </div>
      <p className="px-4 py-2 text-right text-[11px] text-ink-soft">
        Kartengrundlage: Wikimedia Commons (CC BY-SA)
      </p>
    </div>
  );
}

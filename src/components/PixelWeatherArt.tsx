import type { CSSProperties } from "react";
import type { WeatherConditionKey } from "../types/weather";

type PixelWeatherArtProps = {
  condition: WeatherConditionKey;
  isDay?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
};

type SpriteName =
  | "sun"
  | "moon"
  | "partly"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm"
  | "unknown";

const PIXEL_SIZE = {
  sm: 3,
  md: 5,
  lg: 9,
};

const COLORS: Record<string, string> = {
  a: "#fde68a",
  b: "#38bdf8",
  c: "#d4d4d8",
  d: "#71717a",
  f: "#94a3b8",
  l: "#fef08a",
  m: "#a78bfa",
  o: "#fb923c",
  p: "#f0abfc",
  r: "#60a5fa",
  s: "#bfdbfe",
  t: "#7dd3fc",
  w: "#fafafa",
  y: "#facc15",
};

const SPRITES: Record<SpriteName, string[]> = {
  sun: [
    "....y....",
    "..y.y.y..",
    "...yyy...",
    ".yyyyyyy.",
    "yyyyayyyy",
    ".yyyyyyy.",
    "...yyy...",
    "..y.y.y..",
    "....y....",
  ],
  moon: [
    "...mmm...",
    "..mmmmm..",
    ".mmmm....",
    ".mmm.....",
    ".mmm.....",
    ".mmmm....",
    "..mmmmm..",
    "...mmm...",
    ".........",
  ],
  partly: [
    "...y.y......",
    "..yyyyy.....",
    ".yyyyyyy....",
    "..yyyyy.....",
    ".....cccc...",
    "...ccccccc..",
    "..ccccccccc.",
    ".cccccccccc.",
    "..cccccccc..",
    "............",
  ],
  cloud: [
    "............",
    ".....cccc...",
    "...ccccccc..",
    "..ccccccccc.",
    ".cccccccccc.",
    ".cccccccccc.",
    "..cccccccc..",
    "............",
  ],
  fog: [
    "............",
    ".....cccc...",
    "...ccccccc..",
    "..ccccccccc.",
    ".cccccccccc.",
    "..cccccccc..",
    "............",
    ".fffffffff..",
    "...fffffff..",
    "..ffffffff..",
  ],
  drizzle: [
    "............",
    ".....cccc...",
    "...ccccccc..",
    "..ccccccccc.",
    ".cccccccccc.",
    "..cccccccc..",
    "............",
    "..b...b...b.",
    "....b...b...",
    "............",
  ],
  rain: [
    "............",
    ".....cccc...",
    "...ccccccc..",
    "..ccccccccc.",
    ".cccccccccc.",
    "..cccccccc..",
    "............",
    ".b..b..b..b.",
    "..b..b..b...",
    ".b..b..b..b.",
  ],
  snow: [
    "............",
    ".....cccc...",
    "...ccccccc..",
    "..ccccccccc.",
    ".cccccccccc.",
    "..cccccccc..",
    "............",
    ".s..s..s..s.",
    "...s..s..s..",
    ".s..s..s..s.",
  ],
  storm: [
    "............",
    ".....dddd...",
    "...ddddddd..",
    "..ddddddddd.",
    ".dddddddddd.",
    "..dddddddd..",
    ".....ll.....",
    "....ll......",
    "...llll.....",
    "....ll......",
    "...ll.......",
  ],
  unknown: [
    "............",
    "....tttt....",
    "...tt..tt...",
    "......tt....",
    ".....tt.....",
    "............",
    ".....tt.....",
    ".....tt.....",
  ],
};

export function PixelWeatherGlyph({
  condition,
  isDay = true,
  size = "md",
  label = "Weather condition",
}: PixelWeatherArtProps) {
  const spriteName = getSpriteName(condition, isDay);

  return (
    <span className="inline-flex items-center justify-center" aria-label={label} role="img">
      <PixelSprite sprite={SPRITES[spriteName]} pixelSize={PIXEL_SIZE[size]} />
    </span>
  );
}

export function PixelWeatherScene({
  condition,
  isDay = true,
  label = "Current weather",
}: PixelWeatherArtProps) {
  const spriteName = getSpriteName(condition, isDay);

  return (
    <div className="pixel-panel relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/80 p-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:12px_12px]" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-300 via-yellow-200 to-pink-300" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-sky-100">
            Live Pixelcast
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            {isDay ? "Day mode" : "Night mode"}
          </p>
        </div>
        <div className="flex gap-1" aria-hidden="true">
          <span className="h-2 w-2 bg-sky-300" />
          <span className="h-2 w-2 bg-yellow-200" />
          <span className="h-2 w-2 bg-pink-300" />
        </div>
      </div>
      <div
        className="relative mt-5 flex min-h-[132px] items-center justify-center rounded-md border border-zinc-800 bg-[#111827]"
        aria-label={label}
        role="img"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(56,189,248,0.18),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.2),rgba(7,10,18,0.78))]" />
        <div className="relative drop-shadow-[0_0_24px_rgba(45,212,191,0.18)]">
          <PixelSprite sprite={SPRITES[spriteName]} pixelSize={9} />
        </div>
        <PixelHorizon />
      </div>
    </div>
  );
}

function PixelSprite({ sprite, pixelSize }: { sprite: string[]; pixelSize: number }) {
  const width = Math.max(...sprite.map((row) => row.length));
  const cells = sprite.flatMap((row, rowIndex) =>
    Array.from({ length: width }, (_, columnIndex) => ({
      key: `${rowIndex}-${columnIndex}`,
      color: row[columnIndex] ?? ".",
    })),
  );
  const style = {
    "--pixel-size": `${pixelSize}px`,
    gridTemplateColumns: `repeat(${width}, var(--pixel-size))`,
  } as CSSProperties;

  return (
    <span className="grid gap-0.5" style={style} aria-hidden="true">
      {cells.map((cell) => (
        <span
          key={cell.key}
          className="block"
          style={{
            width: "var(--pixel-size)",
            height: "var(--pixel-size)",
            backgroundColor: COLORS[cell.color] ?? "transparent",
          }}
        />
      ))}
    </span>
  );
}

function PixelHorizon() {
  return (
    <div className="absolute inset-x-0 bottom-0 grid h-7 grid-cols-12 items-end gap-px px-3 pb-3" aria-hidden="true">
      {[2, 4, 3, 6, 5, 3, 4, 7, 5, 4, 6, 3].map((height, index) => (
        <span
          key={`${height}-${index}`}
          className="block bg-sky-300/45"
          style={{ height: `${height * 3}px` }}
        />
      ))}
    </div>
  );
}

function getSpriteName(condition: WeatherConditionKey, isDay: boolean): SpriteName {
  switch (condition) {
    case "clear":
      return isDay ? "sun" : "moon";
    case "partly-cloudy":
      return "partly";
    case "cloudy":
      return "cloud";
    case "fog":
      return "fog";
    case "drizzle":
      return "drizzle";
    case "rain":
      return "rain";
    case "snow":
      return "snow";
    case "storm":
      return "storm";
    default:
      return "unknown";
  }
}

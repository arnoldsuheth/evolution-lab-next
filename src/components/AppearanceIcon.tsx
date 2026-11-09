import BeardIcon from "./BeardIcon";
import type { Look } from "@/lib/game";

// Small illustrations in the same visual language as the beard cards.
const options: Partial<Record<keyof Look, readonly string[]>> = {
  hair: [
    "M24 40Q20 12 50 12Q79 12 76 40Q62 26 48 26Q33 27 24 40Z",
    "M24 39Q24 14 50 16Q74 15 76 38L59 29L45 33L35 28Z",
    "M24 66Q12 10 50 11Q87 10 76 66L68 76V35Q51 26 38 35L33 76Z",
    "M24 39Q22 12 48 12L50 29Q33 28 24 39ZM52 12Q77 11 76 39Q65 29 52 29Z",
    "M24 40Q22 12 52 13Q74 11 76 37L62 29Q43 25 24 40ZM73 25Q91 26 87 57L80 68L81 47Z",
    "M24 40Q21 18 42 16Q36 2 51 2Q67 2 60 16Q78 20 76 40Q50 19 24 40Z",
    "M24 73Q11 13 50 12Q77 12 77 36Q58 22 35 34L34 65ZM74 30Q90 36 81 78L74 82Z",
    "M24 40Q20 12 50 12Q78 12 76 39Q50 22 24 40ZM73 48Q90 48 88 63Q84 75 73 67Z",
    "M22 42L19 25L29 24L30 12L45 15L53 7L63 17L75 14L80 40Q50 20 22 42Z",
    "M24 66Q13 15 41 15Q36 2 51 2Q66 2 60 15Q83 20 76 66L67 76V34Q50 24 35 34V74Z",
  ],
  brows: [
    "M32 40l12-2m12 0 12 2", "M31 39q7-4 14 0m10 0q7-4 14 0",
    "M31 37l14 2m10 0 14-2", "M30 40q8-10 16-2m8 0q8-8 16 2",
    "M30 35l15 6m10 0 15-6", "M30 38q10-4 20 2q10-6 20-2",
  ],
  nose: [
    "M47 54q3 4 6 0", "M48 52q2 5 4 0", "M44 54q6-8 12 0q-6 8-12 0Z",
    "M46 43l-5 13q9 9 18 0l-5-13", "M49 43l-7 14h16Z", "M41 54q3-9 9-4q6-5 9 4q-9 11-18 0Z",
  ],
  ears: [
    "M25 47q-9-5-8 7q2 9 9 7m49-14q9-5 8 7q-2 9-9 7",
    "M25 45q-13-7-11 7q2 12 12 10m49-17q13-7 11 7q-2 12-12 10",
    "M25 42q-18-9-15 10q2 15 16 11m49-21q18-9 15 10q-2 15-16 11",
    "M25 47l-15-13q0 23 16 26m49-13 15-13q0 23-16 26",
    "M25 47L4 26q2 30 22 34m49-13 21-21q-2 30-22 34",
    "M25 46q-23-10-20 5q4 12 21 10m49-15q23-10 20 5q-4 12-21 10",
  ],
  moustache: [
    "", "M39 62q6-5 11-2q5-3 11 2", "M33 65q8-11 17-5q9-6 17 5q-9 4-17-1q-8 5-17 1Z",
    "M50 62q-17 9-23-3q4 17 23 6q19 11 23-6q-6 12-23 3Z",
    "M50 61q-17-4-16 15q5-11 16-10q11-1 16 10q1-19-16-15Z", "M31 65q8-12 19-6q11-6 19 6l-7 5-12-4-12 4Z",
  ],
  scar: ["", "M60 50l9 14", "M60 34l-5 22", "M42 66l8 10", "M39 24l14 9", "M59 55l12 10m0-10-12 10"],
  tattoo: [
    "", "M31 51l12 5m-13 0 11 5m16-5 12-5m-10 10 11-5", "M34 53h1m5 4h1m18 0h1m5-4h1",
    "M50 25v12", "M31 50l12 8-9 5m35-13-12 8 9 5", "M60 51q-7 13 0 13q7 0 0-13Z",
  ],
  accessory: [
    "", "M74 57a6 6 0 1 1 0 12a6 6 0 0 1 0-12", "M74 57a6 6 0 1 1 0 12a6 6 0 0 1 0-12M26 57a6 6 0 1 1 0 12a6 6 0 0 1 0-12",
    "M25 36l49 11M35 40q7-4 13 0v9q-7 6-13 0Z", "M27 32q23 7 46 0v6q-23 7-46 0Z", "M52 52a4 4 0 1 1 0 8a4 4 0 0 1 0-8",
  ],
};
const dwarfHair = [
  "", "M25 39Q48 13 75 39M27 36l5 8m3-15 5 8m3-14 5 8m4-8 5 8m3-5 5 8m3-3 5 8",
  "M44 30Q41 12 54 8L58 26L56 34Z", "M25 39q-8 20 0 34m50-34q8 20 0 34M21 45l8 6m-9 6 8 6m43-12 8-6m-7 18 8-6",
  "M39 28q-4-12 11-14q15 2 11 14q-11 6-22 0Z", "M24 65Q11 13 50 12Q89 13 76 65L67 75V36Q50 23 33 36V75Z",
];

export default function AppearanceIcon({ kind, index, dwarf, color }: {
  kind: keyof Look;
  index: number;
  dwarf: boolean;
  color?: string;
}) {
  if (kind === "beard") return <BeardIcon index={index} dwarf={dwarf} />;

  const path = (kind === "hair" && dwarf ? dwarfHair : options[kind])?.[index];
  const accent = kind === "scar" ? "#9c3d3f" : kind === "tattoo" ? "#6741a0" : kind === "accessory" && index !== 3 ? "#bd781e" : "#59331f";
  const solid = (kind === "hair" && !(dwarf && [1, 3].includes(index))) || kind === "moustache" && index > 1 || kind === "accessory" && index === 3;
  return <svg className="appearance-icon" viewBox="0 0 100 100" aria-hidden="true">
    {kind === "body" ? (
      <g transform={`translate(50 51) scale(${0.76 + index * .09} ${0.78 + index * .06}) translate(-50 -51)`} fill="#d6b06a">
        <circle cx="50" cy="23" r="10" />
        <path d="M39 35H61L72 60L64 64L59 51V80H52L50 63L48 80H41V51L36 64L28 60Z" />
      </g>
    ) : <>
      {kind === "ears" && path && <path d={path} fill="#e7bd9e" stroke="#805a40" strokeWidth="2" strokeLinejoin="round" />}
      <ellipse cx="50" cy="47" rx="25" ry="30" fill={kind === "skin" ? color : "#e7bd9e"} stroke="#805a40" strokeWidth="2" />
      <circle cx="41" cy="46" r={kind === "eyes" ? 5 : 3} fill={kind === "eyes" ? color : "#362318"} />
      <circle cx="59" cy="46" r={kind === "eyes" ? 5 : 3} fill={kind === "eyes" ? color : "#362318"} />
      <path d="M45 63q5 4 10 0" fill="none" stroke="#9c6854" strokeWidth="2" />
      {kind === "hairColor" && <path d={options.hair?.[0]} fill={color} stroke="#805a40" strokeWidth="2" />}
      {kind !== "ears" && path && <path d={path} fill={solid ? accent : "none"} stroke={accent} strokeWidth={kind === "brows" && index === 2 ? 5 : 3} strokeLinecap="round" strokeLinejoin="round" />}
    </>}
  </svg>;
}

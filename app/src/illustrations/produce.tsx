// Converted from Figma-exported web SVG (<svg>/<path>/<ellipse>/<circle>) to
// react-native-svg's components, which is what React Native can actually
// render — plain <svg> tags are DOM elements and don't exist on native.
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

export function IllustrationApple({ size = 180 }: { size?: number }) {
  return (
    <Svg viewBox="0 0 200 230" width={size} height={size}>
      <Ellipse cx={100} cy={208} rx={52} ry={10} fill="rgba(0,0,0,0.07)" />
      <Path
        d="M100 80 C60 80 30 108 30 148 C30 185 58 205 100 205 C142 205 170 185 170 148 C170 108 140 80 100 80Z"
        fill="#d9614a"
      />
      <Path d="M100 80 C100 80 100 120 100 205" stroke="rgba(0,0,0,0.06)" strokeWidth={2} fill="none" />
      <Ellipse cx={72} cy={118} rx={16} ry={22} fill="rgba(255,255,255,0.22)" transform="rotate(-18 72 118)" />
      <Ellipse cx={64} cy={110} rx={6} ry={8} fill="rgba(255,255,255,0.18)" transform="rotate(-18 64 110)" />
      <Path d="M100 82 Q104 58 116 50" stroke="#5c3d20" strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <Path d="M112 62 Q138 42 148 58 Q132 76 112 62Z" fill="#6aab80" />
      <Path d="M112 62 Q130 50 148 58" stroke="#4a8060" strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function IllustrationCarrot({ size = 180 }: { size?: number }) {
  return (
    <Svg viewBox="0 0 200 240" width={size} height={size}>
      <Ellipse cx={100} cy={218} rx={42} ry={9} fill="rgba(0,0,0,0.07)" />
      <Path d="M85 75 L72 195 Q100 215 128 195 L115 75 Z" fill="#e8833a" />
      <Path d="M91 80 L80 188" stroke="rgba(255,255,255,0.25)" strokeWidth={5} strokeLinecap="round" />
      <Path d="M98 210 Q102 228 98 235" stroke="#d06e28" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <Path d="M104 208 Q110 222 108 230" stroke="#d06e28" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path d="M92 208 Q86 220 88 228" stroke="#d06e28" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Path
        d="M100 78 Q88 50 72 30 Q82 26 92 48 Q96 30 98 10 Q104 10 104 30 Q110 26 120 42 Q116 52 106 62 Q110 30 116 22 Q126 32 112 56 Q120 40 132 36 Q138 50 118 70 Z"
        fill="#5c8c50"
      />
      <Path d="M100 78 Q90 55 78 38" stroke="#4a7840" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Path d="M100 78 Q100 52 100 28" stroke="#4a7840" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Path d="M100 78 Q112 58 124 40" stroke="#4a7840" strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

const STRAWBERRY_SEEDS: [number, number][] = [
  [80, 120],
  [100, 115],
  [120, 120],
  [72, 145],
  [92, 138],
  [112, 138],
  [132, 145],
  [78, 170],
  [100, 163],
  [122, 170],
  [88, 192],
  [112, 192],
];

export function IllustrationStrawberry({ size = 180 }: { size?: number }) {
  return (
    <Svg viewBox="0 0 200 230" width={size} height={size}>
      <Ellipse cx={100} cy={212} rx={50} ry={10} fill="rgba(0,0,0,0.07)" />
      <Path
        d="M100 80 C65 80 38 108 38 145 C38 178 65 208 100 208 C135 208 162 178 162 145 C162 108 135 80 100 80Z"
        fill="#d94f5c"
      />
      {STRAWBERRY_SEEDS.map(([cx, cy], i) => (
        <Ellipse key={i} cx={cx} cy={cy} rx={4} ry={5} fill="#f0b8be" opacity={0.7} />
      ))}
      <Ellipse cx={72} cy={115} rx={14} ry={20} fill="rgba(255,255,255,0.2)" transform="rotate(-15 72 115)" />
      <Path
        d="M100 82 Q82 60 70 50 Q82 50 90 68 Q92 48 100 36 Q108 48 110 68 Q118 50 130 50 Q118 60 100 82Z"
        fill="#6aab80"
      />
      <Path d="M100 82 Q78 62 68 48" stroke="#4a8060" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Path d="M100 82 Q100 56 100 36" stroke="#4a8060" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Path d="M100 82 Q122 62 132 48" stroke="#4a8060" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <Path d="M100 38 Q104 24 108 18" stroke="#5c3d20" strokeWidth={3.5} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function IllustrationBroccoli({ size = 180 }: { size?: number }) {
  return (
    <Svg viewBox="0 0 200 240" width={size} height={size}>
      <Ellipse cx={100} cy={222} rx={42} ry={9} fill="rgba(0,0,0,0.07)" />
      <Path d="M88 155 L84 215 Q100 225 116 215 L112 155 Z" fill="#7aab60" />
      <Path d="M92 158 L90 210" stroke="rgba(255,255,255,0.2)" strokeWidth={4} strokeLinecap="round" />
      <Circle cx={100} cy={115} r={52} fill="#4a8c50" />
      <Circle cx={68} cy={100} r={32} fill="#569660" />
      <Circle cx={132} cy={100} r={32} fill="#569660" />
      <Circle cx={100} cy={82} r={34} fill="#62a06a" />
      <Circle cx={82} cy={72} r={22} fill="#6eb878" />
      <Circle cx={118} cy={72} r={22} fill="#6eb878" />
      <Circle cx={100} cy={60} r={24} fill="#7cca88" />
      <Circle cx={74} cy={62} r={14} fill="#8ad494" />
      <Circle cx={126} cy={62} r={14} fill="#8ad494" />
      <Circle cx={100} cy={48} r={16} fill="#96de9e" />
      <Circle cx={90} cy={54} r={6} fill="rgba(255,255,255,0.22)" />
      <Circle cx={100} cy={44} r={4} fill="rgba(255,255,255,0.18)" />
    </Svg>
  );
}

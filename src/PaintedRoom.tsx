import { useId } from "react";
import type { Settings } from "./model";
import room from "./assets/painted/reading-nook.webp";
import awake from "./assets/painted/tabby-awake.webp";
import asleep from "./assets/painted/tabby-sleeping.webp";

export default function PaintedRoom({
  settings,
  decor,
  focused = false,
}: {
  settings: Settings;
  decor: string[];
  focused?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  const has = (name: string) => decor.includes(name);
  return (
    <svg
      className={`room-art painted-room ${focused ? "is-focused" : ""}`}
      viewBox="0 0 480 360"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${settings.catName}, a ${focused ? "sleeping" : "green-eyed"} watercolor tabby on a cream armchair in a warm reading nook`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={`${id}-mood`} colorInterpolationFilters="sRGB">
          <feFlood
            floodColor={settings.wall}
            floodOpacity=".14"
            result="tint"
          />
          <feBlend in="SourceGraphic" in2="tint" mode="soft-light" />
        </filter>
        <filter id={`${id}-coat`} colorInterpolationFilters="sRGB">
          <feFlood floodColor={settings.fur} floodOpacity=".13" result="tint" />
          <feComposite
            in="tint"
            in2="SourceAlpha"
            operator="in"
            result="clipped"
          />
          <feBlend in="SourceGraphic" in2="clipped" mode="soft-light" />
        </filter>
        <filter id={`${id}-brush`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".17"
            numOctaves="2"
            seed="11"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.1" />
          <feGaussianBlur stdDeviation=".25" />
        </filter>
        <radialGradient id={`${id}-glow`}>
          <stop stopColor="#ffd58c" stopOpacity=".7" />
          <stop offset="1" stopColor="#e9b766" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${id}-floor`}>
          <path d="M0 303H265V360H0Z" />
        </clipPath>
      </defs>
      <image href={room} width="480" height="360" filter={`url(#${id}-mood)`} />
      <path
        d="M121 175Q120 122 161 119Q218 110 277 120L285 193Q293 218 286 278Q239 299 142 293Q112 288 110 263L91 203Q87 182 105 176Z"
        fill={settings.chair}
        opacity=".1"
        style={{ mixBlendMode: "color" }}
      />
      {has("rug") && (
        <g
          clipPath={`url(#${id}-floor)`}
          filter={`url(#${id}-brush)`}
          opacity=".77"
        >
          <ellipse cx="180" cy="343" rx="151" ry="24" fill="#bc9574" />
          <ellipse
            cx="180"
            cy="343"
            rx="138"
            ry="18"
            fill="none"
            stroke="#e5cbb1"
            strokeWidth="2"
            strokeDasharray="5 4"
          />
          <ellipse
            cx="180"
            cy="343"
            rx="120"
            ry="13"
            fill="none"
            stroke="#84694e"
            strokeWidth="1"
          />
        </g>
      )}
      {has("plant") && (
        <g filter={`url(#${id}-brush)`}>
          <path
            d="M61 325L59 270M59 301L43 280M59 293L76 273"
            fill="none"
            stroke="#6e7350"
            strokeWidth="1.4"
          />
          <path
            d="M58 284Q41 282 48 263Q61 266 58 284M60 293Q62 274 79 278Q79 292 60 293M56 300Q36 299 37 284Q51 283 56 300M59 273Q51 255 62 249Q72 260 59 273"
            fill="#707854"
            stroke="#5b6545"
            strokeWidth=".7"
          />
          <path
            d="M45 311Q59 308 73 311L70 335Q59 341 48 335Z"
            fill="#a08062"
            stroke="#80654c"
            strokeWidth="1"
          />
          <path
            d="M47 315Q59 318 71 315M49 330L69 332"
            stroke="#d0b594"
            fill="none"
            opacity=".7"
          />
        </g>
      )}
      {has("books") && (
        <g filter={`url(#${id}-brush)`} stroke="#755640" strokeWidth=".8">
          <path d="M75 324L125 319L128 329L78 335Z" fill="#66705a" />
          <path d="M81 312L132 315L131 324L80 322Z" fill="#ab7b59" />
          <path d="M84 303L126 302L127 313L84 315Z" fill="#d5bd96" />
          <path
            d="M85 307L123 306M84 318L129 320M81 329L123 324"
            stroke="#e6d9b7"
            strokeWidth="2"
          />
        </g>
      )}
      {has("lamp") && (
        <g>
          <ellipse
            cx="331"
            cy="299"
            rx="27"
            ry="34"
            fill={`url(#${id}-glow)`}
          />
          <g filter={`url(#${id}-brush)`}>
            <ellipse cx="331" cy="316" rx="10" ry="3" fill="#70543d" />
            <path
              d="M324 291H338L336 314Q331 317 326 314Z"
              fill="#caa371"
              stroke="#99734f"
              strokeWidth="1"
            />
            <ellipse cx="331" cy="291" rx="7" ry="2" fill="#f0d7a8" />
            <path
              d="M331 290Q324 285 331 277Q337 284 331 290"
              fill="#fff0b4"
              className="candle-flame"
            />
          </g>
        </g>
      )}
      {has("art") && (
        <g filter={`url(#${id}-brush)`}>
          <path d="M365 107L399 109L397 153L363 152Z" fill="#805e42" />
          <path d="M368 111L395 112L394 149L367 148Z" fill="#e9d6b5" />
          <path
            d="M378 144L384 119M381 134Q371 134 373 124Q381 125 381 134M382 129Q391 129 391 120Q383 121 382 129"
            fill="#7e865f"
            stroke="#6c7654"
            strokeWidth=".8"
          />
        </g>
      )}
      <ellipse cx="210" cy="254" rx="58" ry="6" fill="#6c4d32" opacity=".14" />
      <g className="painted-cat" filter={`url(#${id}-coat)`}>
        <image
          href={focused ? asleep : awake}
          x="135"
          y="180"
          width="150"
          height="75"
        />
      </g>
    </svg>
  );
}

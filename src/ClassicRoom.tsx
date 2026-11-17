import type { Settings } from "./model";
export default function Room({
  settings,
  decor,
  focused = false,
  mini = false,
}: {
  settings: Settings;
  decor: string[];
  focused?: boolean;
  mini?: boolean;
}) {
  const has = (id: string) => decor.includes(id);
  return (
    <svg
      className={`room-art ${focused ? "is-focused" : ""} ${mini ? "mini" : ""}`}
      viewBox="0 0 480 400"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${settings.catName}, a sleepy cat on a cozy chair in your decorated room`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sunlight" x2=".3" y2="1">
          <stop stopColor="#fff9d9" stopOpacity=".65" />
          <stop offset="1" stopColor="#fff9d9" stopOpacity="0" />
        </linearGradient>
        <pattern id="grain" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="3" r=".5" fill="#5f4839" opacity=".09" />
        </pattern>
      </defs>
      <path d="M0 0H480V304H0Z" fill={settings.wall} />
      <path d="M0 304H480V400H0Z" fill="#dfc5a4" />
      <path d="M0 305H480" stroke="#c4a98a" strokeWidth="3" />
      <path
        d="M0 356H480M83 305L58 400M355 305L400 400"
        stroke="#c6ab8c"
        opacity=".5"
      />
      <path
        d="M39 36H180V193H39Z"
        fill="#e4c19e"
        stroke="#b08d6d"
        strokeWidth="3"
      />
      <path d="M47 44H172V185H47Z" fill="#c1d4c7" />
      <circle cx="141" cy="76" r="21" fill="#fff0b0" />
      <path d="M48 144Q83 109 114 140T172 133V185H48" fill="#94b49a" />
      <path d="M48 166Q78 139 118 163T172 156V185H48" fill="#799b81" />
      <path d="M110 44V185M47 114H172" stroke="#f2e3cd" strokeWidth="7" />
      <path
        d="M32 195H188"
        stroke="#b08d6d"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M48 197H171L336 356H135Z" fill="url(#sunlight)" />
      <path d="M32 30Q52 20 67 31V196Q45 180 32 193Z" fill="#faf0de" />
      <path d="M176 29Q189 22 197 31V196Q179 185 166 192Z" fill="#faf0de" />
      <path d="M44 33V183M184 33V181" stroke="#e4d1b9" strokeWidth="2" />
      <ellipse cx="254" cy="339" rx="116" ry="20" fill="#ae9174" opacity=".2" />
      {has("rug") && (
        <g>
          <ellipse cx="245" cy="348" rx="151" ry="32" fill="#c58362" />
          <ellipse
            cx="245"
            cy="348"
            rx="135"
            ry="24"
            fill="none"
            stroke="#e9bb91"
            strokeWidth="3"
            strokeDasharray="7 5"
          />
          <path
            d="M95 343L81 340M95 349L80 349M96 355L82 359M394 343L408 340M395 349H410M393 355L408 359"
            stroke="#c58362"
            strokeWidth="3"
          />
        </g>
      )}
      <g stroke="#4d6356" strokeWidth="3" strokeLinejoin="round">
        <path
          d="M178 285L168 337Q173 341 179 337L193 287M304 287L319 337Q325 341 328 336L318 283"
          fill="#a67b55"
          stroke="#795b40"
        />
        <path
          d="M167 259L166 150Q167 115 202 113L291 116Q322 117 322 150L325 270"
          fill={settings.chair}
        />
        <path
          d="M184 156Q184 133 207 134H282Q304 135 304 156L309 256H181Z"
          fill="#fff"
          opacity=".13"
          stroke="none"
        />
        <path
          d="M161 247Q140 232 141 255L149 285Q152 301 175 301H313Q333 300 337 280L343 253Q344 234 324 241L312 263H181Z"
          fill={settings.chair}
        />
        <path
          d="M174 263Q238 250 316 264L312 282Q243 294 178 283Z"
          fill={settings.chair}
        />
        <path d="M177 265Q242 274 313 264" fill="none" opacity=".6" />
      </g>
      <g
        className="cat-body"
        stroke="#79543d"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M287 252Q328 247 322 219Q319 207 307 209Q301 214 310 220Q318 234 290 236"
          className="cat-tail"
          fill={settings.fur}
        />
        <path
          d="M212 227Q213 181 254 190Q288 194 299 240Q303 253 284 256L220 258Z"
          fill={settings.fur}
        />
        <path
          d="M252 201L245 212M266 205L258 217M278 214L270 225"
          stroke="#9c6845"
          strokeWidth="5"
        />
        <path
          d="M181 220L179 186L202 201Q214 196 227 204L246 190L240 225Q245 250 216 254Q179 253 181 220Z"
          fill={settings.fur}
        />
        <path
          d="M185 196L186 212L198 205M237 201L227 208L237 216"
          fill="#e7b0a0"
          stroke="none"
        />
        <path
          d="M188 229Q194 236 201 229M218 229Q225 235 232 228"
          fill="none"
        />
        <path d="M206 237L212 237L209 241Z" fill="#ad7865" stroke="none" />
        <path
          d="M209 241Q204 245 202 241M209 241Q214 245 216 241M184 235L173 233M184 240L173 242M236 235L246 232M236 240L248 241"
          fill="none"
          strokeWidth="1.5"
        />
        <path
          d="M235 244Q255 236 263 250Q261 258 243 257L223 258"
          fill={settings.fur}
        />
        <path
          d="M197 208L202 217M207 206L209 215M218 208L216 217"
          stroke="#9c6845"
          strokeWidth="3"
        />
      </g>
      <g
        className="sleep-z"
        fill="#866d53"
        fontFamily="Georgia,serif"
        fontSize="17"
      >
        <text x="296" y="175">
          z
        </text>
        <text x="311" y="154" fontSize="23">
          z
        </text>
        <text x="330" y="128" fontSize="29">
          z
        </text>
      </g>
      {has("plant") && (
        <g stroke="#698061" strokeWidth="2.5">
          <path
            d="M77 310L75 245M77 288Q54 268 52 252M77 274Q97 255 101 233"
            fill="none"
          />
          <path
            d="M75 261Q50 258 61 231Q81 239 75 261M79 278Q81 251 106 254Q104 276 79 278M69 277Q40 279 42 259Q63 253 69 277M76 246Q62 224 79 209Q96 231 76 246M98 246Q90 223 110 218Q119 235 98 246"
            fill="#799b73"
          />
          <path
            d="M55 302H97L91 337Q77 344 62 337Z"
            fill="#c58466"
            stroke="#a86a50"
          />
          <path d="M52 300H100V309H52Z" fill="#db9a77" stroke="#a86a50" />
        </g>
      )}
      {has("books") && (
        <g stroke="#8c7156" strokeWidth="2">
          <path d="M347 329H400V340H347Z" fill="#8ca497" />
          <path d="M353 316H404V327H353Z" fill="#e6b775" />
          <path d="M348 303H397V315H348Z" fill="#bc7b65" />
          <path
            d="M355 307H395M358 320H400M352 333H398"
            stroke="#f4e5cd"
            strokeWidth="3"
          />
        </g>
      )}
      {has("lamp") && (
        <g stroke="#937853" strokeWidth="3">
          <path d="M393 183V330M373 331H413" />
          <path d="M377 141H408L422 183H362Z" fill="#e3b875" />
          <circle
            cx="392"
            cy="174"
            r="22"
            fill="#fff2bc"
            opacity=".3"
            stroke="none"
          />
        </g>
      )}
      {has("art") && (
        <g>
          <path d="M337 36H410V116H337Z" fill="#b38f69" />
          <path d="M344 43H403V109H344Z" fill="#6c8290" />
          <circle cx="376" cy="70" r="15" fill="#f4d898" />
          <circle cx="384" cy="63" r="14" fill="#6c8290" />
          <path d="M345 102L361 82L373 95L385 88L402 105" fill="#a4b4a8" />
        </g>
      )}
      <path d="M0 0H480V400H0Z" fill="url(#grain)" pointerEvents="none" />
    </svg>
  );
}

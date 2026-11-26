import "./HuevoMascota.css";

export default function HuevoMascota({ phase = "idle", className = "" }) {
  return (
    <div
      className={`huevo-mascota huevo-mascota--${phase} ${className}`.trim()}
      aria-hidden="true"
    >
      <svg viewBox="0 0 180 190" className="huevo-mascota__svg">
        <defs>
          <linearGradient id="huevo-shell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fffef9" />
            <stop offset="0.62" stopColor="#fffaf0" />
            <stop offset="1" stopColor="#f2e7d4" />
          </linearGradient>
          <linearGradient id="pollito-feathers" x1="0" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#ffe88a" />
            <stop offset="1" stopColor="#f8b936" />
          </linearGradient>
          <clipPath id="huevo-interior">
            <path d="M90 18 C119 18 139 48 145 83 C151 119 133 159 108 171 C97 176 83 176 72 171 C47 159 29 119 35 83 C41 48 61 18 90 18Z" />
          </clipPath>
        </defs>

        <ellipse cx="91" cy="177" rx="48" ry="7" className="huevo-mascota__shadow" />

        <g className="huevo-mascota__body">
          <g clipPath="url(#huevo-interior)">
            <path
              className="huevo-mascota__shell-back"
              d="M90 18 C119 18 139 48 145 83 C151 119 133 159 108 171 C97 176 83 176 72 171 C47 159 29 119 35 83 C41 48 61 18 90 18Z"
            />
            <g className="huevo-mascota__chick">
              <ellipse cx="90" cy="93" rx="29" ry="27" fill="url(#pollito-feathers)" />
              <path d="M78 69 Q72 58 81 60 Q87 62 88 70 M96 69 Q103 58 108 63 Q110 67 102 73" fill="#f8c844" />
              <ellipse cx="80" cy="91" rx="2.4" ry="3.4" fill="#5f4737" />
              <ellipse cx="100" cy="91" rx="2.4" ry="3.4" fill="#5f4737" />
              <path d="M86 98 Q90 102 94 98 L90 105Z" fill="#e88828" />
              <ellipse cx="73" cy="99" rx="5" ry="2.5" fill="#f19b79" opacity=".7" />
              <ellipse cx="107" cy="99" rx="5" ry="2.5" fill="#f19b79" opacity=".7" />
            </g>
          </g>

          <path
            className="huevo-mascota__lower-shell"
            d="M36 78 C50 88 66 91 90 87 C114 91 130 88 144 78 C141 120 126 155 108 168 C97 175 83 175 72 168 C54 155 39 120 36 78Z"
          />
          <path
            className="huevo-mascota__lid"
            d="M90 18 C119 18 139 48 144 78 C130 88 114 91 90 87 C66 91 50 88 36 78 C41 48 61 18 90 18Z"
          />
          <path
            className="huevo-mascota__seam"
            d="M36 78 C50 88 66 91 90 87 C114 91 130 88 144 78"
          />
          <path
            className="huevo-mascota__outline"
            d="M90 18 C119 18 139 48 145 83 C151 119 133 159 108 171 C97 176 83 176 72 171 C47 159 29 119 35 83 C41 48 61 18 90 18Z"
          />
          <path className="huevo-mascota__shine" d="M54 69 C58 49 69 34 79 31" />
          <circle cx="53" cy="88" r="3" fill="#fff" opacity=".75" />
        </g>
      </svg>
    </div>
  );
}

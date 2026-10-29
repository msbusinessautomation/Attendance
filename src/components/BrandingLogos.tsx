import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

/**
 * Logo 1: Traditional School Emblem
 * Used for official attendance reports, student identity cards, certificates
 */
export const TraditionalEmblem: React.FC<LogoProps> = ({
  className = '',
  size = 64,
  showText = false
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm"
      >
        {/* Outer Circular Rim */}
        <circle cx="100" cy="100" r="96" fill="#12365A" stroke="#D4AF37" strokeWidth="4" />
        <circle cx="100" cy="100" r="88" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Inner Ivory Field */}
        <circle cx="100" cy="100" r="80" fill="#FAFBFD" stroke="#086B9B" strokeWidth="2" />

        {/* Radiating Rays of Divine Knowledge */}
        <g opacity="0.25" stroke="#D4AF37" strokeWidth="1.5">
          <line x1="100" y1="30" x2="100" y2="52" />
          <line x1="100" y1="148" x2="100" y2="170" />
          <line x1="30" y1="100" x2="52" y2="100" />
          <line x1="148" y1="100" x2="170" y2="100" />
          <line x1="50" y1="50" x2="66" y2="66" />
          <line x1="150" y1="50" x2="134" y2="66" />
          <line x1="50" y1="150" x2="66" y2="134" />
          <line x1="150" y1="150" x2="134" y2="134" />
        </g>

        {/* Upper Arabic Arc Header Text */}
        <path
          id="upperArc"
          d="M 32,100 A 68,68 0 0,1 168,100"
          fill="none"
        />
        <text fill="#12365A" fontSize="10.5" fontWeight="700" letterSpacing="0.8">
          <textPath href="#upperArc" startOffset="50%" textAnchor="middle">
            KANZ UL IMAN SCHOOL
          </textPath>
        </text>

        {/* Lower Arc Header Text */}
        <path
          id="lowerArc"
          d="M 168,100 A 68,68 0 0,1 32,100"
          fill="none"
        />
        <text fill="#086B9B" fontSize="9.5" fontWeight="600" letterSpacing="0.5">
          <textPath href="#lowerArc" startOffset="50%" textAnchor="middle">
            OF QURAN SCIENCES • 86
          </textPath>
        </text>

        {/* Central Quran on Wooden Rehal */}
        {/* Rehal base stand */}
        <path
          d="M68 128 L100 102 L132 128 L124 133 L100 112 L76 133 Z"
          fill="#D4AF37"
        />
        <path
          d="M78 131 L100 114 L122 131 L116 135 L100 120 L84 135 Z"
          fill="#12365A"
        />

        {/* Holy Quran Pages Open */}
        <path
          d="M100 82 C88 78 72 80 60 84 C58 98 58 108 60 115 C72 110 88 108 100 112 C112 108 128 110 140 115 C142 108 142 98 140 84 C128 80 112 78 100 82 Z"
          fill="#FFFFFF"
          stroke="#12365A"
          strokeWidth="2.5"
        />
        {/* Book spine & page dividers */}
        <path d="M100 82 L100 112" stroke="#D4AF37" strokeWidth="2.5" />
        <path d="M68 90 C78 88 88 87 95 88" stroke="#086B9B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M68 96 C78 94 88 93 95 94" stroke="#086B9B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M68 102 C78 100 88 99 95 100" stroke="#086B9B" strokeWidth="1.5" strokeLinecap="round" />

        <path d="M105 88 C112 87 122 88 132 90" stroke="#086B9B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M105 94 C112 93 122 94 132 96" stroke="#086B9B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M105 100 C112 99 122 100 132 102" stroke="#086B9B" strokeWidth="1.5" strokeLinecap="round" />

        {/* Top Islamic Crescent & Star */}
        <path
          d="M96 61 A 6 6 0 1 1 106 67 A 7 7 0 1 0 96 61 Z"
          fill="#D4AF37"
        />
        <polygon
          points="102,60 103.5,63.5 107,63.5 104,65.5 105.5,69 102,67 98.5,69 100,65.5 97,63.5 100.5,63.5"
          fill="#D4AF37"
          transform="scale(0.8) translate(28, 12)"
        />

        {/* Bottom Banner with Campus & Branch 86 */}
        <rect x="52" y="145" width="96" height="18" rx="4" fill="#12365A" stroke="#D4AF37" strokeWidth="1" />
        <text x="100" y="157" fill="#FFFFFF" fontSize="8" fontWeight="700" textAnchor="middle" letterSpacing="0.4">
          BRANCH 86 • LAHORE
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col text-left">
          <span className="text-xs uppercase tracking-wider font-bold text-[#D4AF37]">
            Branch 86 • Hazrt Abu Bakar Siddiqui Campus
          </span>
          <span className="text-sm font-bold text-[#12365A] leading-tight">
            Kanz Ul Iman School of Quran Sciences
          </span>
          <span className="text-[11px] text-[#18283B]/70">
            Mehar Pura, Awan Town, Lahore
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Logo 2: Modern KIQS Logo
 * Used for main app icon, splash screen, top header branding, launcher
 */
export const ModernLogo: React.FC<LogoProps> = ({
  className = '',
  size = 52,
  showText = true
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md rounded-2xl"
      >
        <defs>
          <linearGradient id="modernBg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#12365A" />
            <stop offset="1" stopColor="#086B9B" />
          </linearGradient>
          <linearGradient id="goldAccent" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE047" />
            <stop offset="1" stopColor="#D4AF37" />
          </linearGradient>
        </defs>

        {/* Rounded Modern App Shield */}
        <rect width="120" height="120" rx="28" fill="url(#modernBg)" />
        <rect x="3" y="3" width="114" height="114" rx="25" stroke="#D4AF37" strokeWidth="1.5" opacity="0.6" />

        {/* Geometric Islamic 8-Point Star in Background */}
        <g opacity="0.18" fill="none" stroke="#FFFFFF" strokeWidth="1.5">
          <rect x="35" y="35" width="50" height="50" rx="4" />
          <rect x="35" y="35" width="50" height="50" rx="4" transform="rotate(45 60 60)" />
        </g>

        {/* Dynamic Modern Stylized Open Book & Knowledge Beams */}
        <path
          d="M60 48 L88 36 V72 L60 84 V48 Z"
          fill="url(#goldAccent)"
          opacity="0.95"
        />
        <path
          d="M60 48 L32 36 V72 L60 84 V48 Z"
          fill="#FFFFFF"
          opacity="0.9"
        />
        {/* Central Spine Line */}
        <line x1="60" y1="46" x2="60" y2="85" stroke="#12365A" strokeWidth="3" strokeLinecap="round" />

        {/* Monogram KIQS Letters */}
        <text
          x="60"
          y="102"
          fill="#FFFFFF"
          fontSize="18"
          fontWeight="800"
          letterSpacing="2.5"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
        >
          KIQS
        </text>

        {/* Small Branch 86 Indicator */}
        <circle cx="96" cy="24" r="14" fill="#D4AF37" />
        <text
          x="96"
          y="28"
          fill="#12365A"
          fontSize="10"
          fontWeight="800"
          textAnchor="middle"
        >
          86
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-extrabold tracking-tight text-[#12365A]">
              KIQS
            </span>
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-[#12365A]/10 text-[#12365A]">
              SMART ATTENDANCE
            </span>
          </div>
          <span className="text-xs font-medium text-[#086B9B] truncate">
            Kanz Ul Iman • Branch 86
          </span>
        </div>
      )}
    </div>
  );
};

import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 빨대 */}
          <rect x="14.5" y="1" width="2.5" height="7" rx="1.25" fill="#ff6b9d" />

          {/* 뚜껑 */}
          <ellipse cx="16" cy="8.5" rx="6" ry="2.5" fill="#ff6b9d" />

          {/* 병 몸통 (항아리 모양) */}
          <path
            d="M10 10 Q7 13 7 18 Q7 26 16 27 Q25 26 25 18 Q25 13 22 10 Z"
            fill="#FFE566"
          />

          {/* 병 하이라이트 */}
          <path
            d="M12 12 Q10.5 15 10.5 18 Q10.5 22 13 24"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.6"
          />

          {/* 병 테두리 */}
          <path
            d="M10 10 Q7 13 7 18 Q7 26 16 27 Q25 26 25 18 Q25 13 22 10 Z"
            stroke="#d4a000"
            strokeWidth="0.8"
            fill="none"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}

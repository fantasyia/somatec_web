import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#03111F',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 36,
        }}
      >
        <span
          style={{
            color: '#C9A24A',
            fontSize: 110,
            fontWeight: 700,
            letterSpacing: '-4px',
            fontFamily: 'serif',
          }}
        >
          M
        </span>
      </div>
    ),
    { ...size },
  );
}

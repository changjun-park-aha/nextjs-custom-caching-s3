import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export async function GET(req: NextRequest): Promise<Response | ImageResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const isLight = req.headers.get('Sec-CH-Prefers-Color-Scheme') === 'light'

    const title = searchParams.has('title')
      ? searchParams.get('title')
      : '아하 DEV'

    const file = await readFile(join(process.cwd(), './Inter-SemiBold.ttf'))
    const font = Uint8Array.from(file).buffer

    return new ImageResponse(
      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            fontFamily: 'Inter',
            fontSize: '48px',
            fontWeight: '600',
            letterSpacing: '-0.04em',
            color: isLight ? 'black' : 'white',
            top: '250px',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'pre-wrap',
            maxWidth: '750px',
            textAlign: 'center',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          {title}
        </div>
      </div>,
      {
        width: 843,
        height: 441,
        fonts: [{ name: 'Inter', data: font, style: 'normal', weight: 400 }],
      },
    )
  } catch (e) {
    if (!(e instanceof Error)) throw e

    return new Response(`Failed to generate the image`, { status: 500 })
  }
}

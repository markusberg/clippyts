/**
 * Generate agents json payloads in dist-folder
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { agents } from './types.js'
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const cwd = dirname(__filename)

agents.forEach((name) => {
  const src = join(cwd, name)
  const dst = join(cwd, '..', '..', 'dist', 'agents', name)
  mkdirSync(dst, { recursive: true })
  format(src, dst, 'agent', 'agent')
  format(src, dst, 'sounds-mp3', 'soundMp3')
  format(src, dst, 'sounds-ogg', 'soundOgg')
  copyFileSync(
    join(cwd, '..', '..', 'src', 'agents', name, 'map.png'),
    join(dst, 'map.png'),
  )
})

async function format(
  dirSrc: string,
  dirDst: string,
  file: string,
  prop: string,
) {
  const filename = join(dirSrc, `${file}.js`)
  const struct = await import(filename)
  const data = JSON.stringify(struct[prop])
  const outFile = join(dirDst, `${file}.json`)
  writeFileSync(outFile, data)
}

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// compute __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const logFile = path.resolve(__dirname, '../../error/gacha_import_log.jsonl')

export async function logImport(entry: any) {
  try {
    const dir = path.dirname(logFile)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const payload = {
      ts: new Date().toISOString(),
      ...entry
    }

    fs.appendFileSync(logFile, JSON.stringify(payload) + '\n', { encoding: 'utf8' })
  } catch (e) {
    // best-effort logging, do not throw
    console.error('Failed to write import log:', e)
  }
}

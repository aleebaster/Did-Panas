import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DB_FILE = path.join(process.cwd(), "data", "db.json");
const BACKUP_FILE = path.join(os.tmpdir(), "did-panas-db.backup.json");
const STATE_FILE = path.join(os.tmpdir(), "did-panas-db.state.json");

export default function globalTeardown(): void {
  if (!fs.existsSync(STATE_FILE)) {
    return;
  }

  let hadDb = false;
  try {
    hadDb = (JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as { hadDb?: boolean }).hadDb === true;
  } catch {
    hadDb = fs.existsSync(BACKUP_FILE);
  }

  if (hadDb && fs.existsSync(BACKUP_FILE)) {
    fs.copyFileSync(BACKUP_FILE, DB_FILE);
  } else if (fs.existsSync(DB_FILE)) {
    fs.rmSync(DB_FILE, { force: true });
  }

  fs.rmSync(BACKUP_FILE, { force: true });
  fs.rmSync(STATE_FILE, { force: true });
}

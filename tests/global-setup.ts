import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DB_FILE = path.join(process.cwd(), "data", "db.json");
const BACKUP_FILE = path.join(os.tmpdir(), "did-panas-db.backup.json");
const STATE_FILE = path.join(os.tmpdir(), "did-panas-db.state.json");

export default function globalSetup(): void {
  const hadDb = fs.existsSync(DB_FILE);

  if (hadDb) {
    fs.copyFileSync(DB_FILE, BACKUP_FILE);
    fs.rmSync(DB_FILE, { force: true });
  } else if (fs.existsSync(BACKUP_FILE)) {
    fs.rmSync(BACKUP_FILE, { force: true });
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify({ hadDb }), "utf8");
}

// app.py의 createSession() 로직을 Node/Next.js API로 포팅
// - SQLite에 photo_sessions 테이블(파이썬 model.py와 동일 스키마) 저장
// - 입력: POST body.frame
// - 출력: { sessionID }

import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const frame = req.body?.frame || req.query?.frame;
  if (!frame) {
    return res
      .status(400)
      .json({ result: false, message: "필수 파라미터가 누락되었습니다." });
  }

  try {
    const sessionID = createUUID();
    const db = await getDb();

    await db.run(`
      CREATE TABLE IF NOT EXISTS photo_sessions (
        id TEXT PRIMARY KEY NOT NULL,
        frame TEXT NOT NULL,
        qrfile TEXT,
        photofile TEXT
      )
    `);

    await db.run(
      `INSERT INTO photo_sessions (id, frame, qrfile, photofile) VALUES (?, ?, NULL, NULL)`,
      sessionID,
      frame
    );

    await db.close();

    return res.status(200).json({ sessionID });
  } catch (e) {
    console.error("createSession error:", e);
    return res
      .status(500)
      .json({ message: "error", error: e?.message ?? String(e) });
  }
}

function createUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function getDb() {
  const dbPath = path.join(process.cwd(), "db.db");
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}

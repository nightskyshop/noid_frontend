import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import formidable from "formidable";
import fs from "fs";
import fsPromises from "fs/promises";
// QR 코드(갤러리 다운로드 링크) 비활성화로 미사용
// import QRCode from "qrcode";
import sharp from "sharp";
// [사진 자동 출력] 실험적 기능 — 제거 시 이 import 와 아래 블록만 삭제
import { printPhoto } from "../../lib/printer";
// 노이드 갤러리(pythonanywhere) 업로드 비활성화로 아래 모듈은 현재 미사용
// import FormData from "form-data";
// import axios from "axios";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  let db;
  try {
    const { fields, files } = await parseForm(req);
    const session = fields.session?.[0];
    // 갤러리 업로드 비활성화로 미사용
    // const upload = fields.upload?.[0];
    // const uploadToGallery = upload === "true";

    if (!session) {
      return res.status(400).json({
        result: false,
        message: "필수 파라미터 session이 누락되었습니다.",
      });
    }

    const photoKeys = ["photo1", "photo2", "photo3", "photo4"];
    for (const key of photoKeys) {
      if (!files[key]?.[0]) {
        return res.status(400).json({
          result: false,
          message: `필요한 파라미터 ${key}가 누락되었습니다.`,
        });
      }
    }

    db = await getDb();
    const photoSession = await db.get(
      "SELECT * FROM photo_sessions WHERE id = ? LIMIT 1",
      session
    );

    if (!photoSession) {
      return res.status(400).json({
        result: false,
        message: "존재하지 않거나 마감된 세션입니다.",
      });
    }

    // 🔹 이미지 base64 배열 생성 (Flask data[])
    const base64List = [];
    for (const key of photoKeys) {
      const file = files[key][0];
      const buf = await fsPromises.readFile(file.filepath);

      // 이미지 검증
      try {
        await sharp(buf).metadata();
      } catch {
        return res.status(400).json({
          result: false,
          message: "유효하지 않은 이미지 파일이 포함되어 있습니다.",
        });
      }

      base64List.push(buf.toString("base64"));
    }

    // 🔥 image.create 대체
    const photofile = await createImage(
      base64List,
      photoSession.frame,
      session
    );

    // ===== QR 생성(갤러리 다운로드 링크) 비활성화 =====
    // const qrLink = `https://dkshnoid.pythonanywhere.com/download?session=${session}`;
    // const qrfile = await QRCode.toDataURL(qrLink, {
    //   margin: 4,
    //   width: 400,
    // });
    // ===== QR 생성 비활성화 끝 =====

    const savedPath = await saveBase64AsPng(photofile, session);

    // ===== [사진 자동 출력] 실험적 기능 — 제거 시 이 블록만 삭제 =====
    // PRINT_ENABLED=true 일 때만 동작. 실패해도 업로드 응답을 막지 않음(fire-and-forget).
    printPhoto(savedPath).catch((e) =>
      console.error("[printer] 자동 출력 오류:", e?.message)
    );
    // ===== [사진 자동 출력] 끝 =====

    // 로컬 동작: QR 없이 photofile 만 저장
    await db.run(
      `UPDATE photo_sessions SET photofile = ? WHERE id = ?`,
      photofile,
      session
    );

    // ===== 노이드 갤러리(pythonanywhere) 업로드 비활성화 =====
    // 아래 블록은 합성된 사진을 외부 갤러리 서버로 전송하는 부분으로, 전체 주석 처리함.
    // const outputDir = path.join(process.cwd(), "images");
    // const filePath = path.join(outputDir, `${session}.png`);

    // const form = new FormData();
    // form.append("file", fs.createReadStream(filePath), {
    //   filename: `${session}.png`,
    //   contentType: "image/png",
    // });
    // form.append("upload", uploadToGallery ? "true" : "false");

    // console.log(form);

    // try {
    //   const response = await axios.post(
    //     "https://dkshnoid.pythonanywhere.com/upload?password=8krybwTfjJEIFq8J50CfEJlyFMlxYNl04pZDcgXKPz8pY3E362",
    //     form,
    //     {
    //       headers: {
    //         ...form.getHeaders(), // boundary 포함된 Content-Type
    //       },
    //       maxBodyLength: Infinity,
    //     }
    //   );

    //   console.log("업로드 서버 응답:", response.status, response.data);
    // } catch (e) {
    //   console.error("업로드 서버 전송 오류:", e.response?.data || e.message);
    // }
    // ===== 갤러리 업로드 비활성화 끝 =====

    return res.status(200).json({
      result: true,
      message: "성공적으로 이미지를 업로드하였습니다.",
      // qrcode: qrfile, // QR 비활성화
      photo: photofile,
    });
  } catch (e) {
    console.error("upload error:", e);
    return res.status(500).json({
      result: false,
      message: "파일 처리 중 오류가 발생했습니다.",
      error: e?.message,
    });
  } finally {
    if (db) await db.close();
  }
}

/* =========================
   image.create() JS 버전
========================= */
async function createImage(data, frameName, session) {
  const framePath = path.join(
    process.cwd(),
    "../noid/public/images",
    `${frameName}.png`
  );

  const coordinates = [
    { left: 74, top: 355 },
    { left: 619, top: 92 },
    { left: 74, top: 1053 },
    { left: 619, top: 790 },
  ];

  const resizedImages = await Promise.all(
    data.map((b64) =>
      sharp(Buffer.from(b64, "base64")).resize(508, 668).png().toBuffer()
    )
  );

  let frame = sharp(framePath).png();

  const composites = resizedImages.map((img, i) => ({
    input: img,
    left: coordinates[i].left,
    top: coordinates[i].top,
  }));

  const outputBuffer = await frame.composite(composites).png().toBuffer();

  return outputBuffer.toString("base64");
}

export async function saveBase64AsPng(base64, filename) {
  const outputDir = path.join(process.cwd(), "images");
  await fsPromises.mkdir(outputDir, { recursive: true });

  const filePath = path.join(outputDir, `${filename}.png`);
  const buffer = Buffer.from(base64, "base64");

  await fsPromises.writeFile(filePath, buffer);

  return filePath;
}

/* ========================= */

function parseForm(req) {
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

async function getDb() {
  const dbPath = path.join(process.cwd(), "db.db");
  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}

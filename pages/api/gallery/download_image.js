// Flask app.py의 /download_image 포팅 (첨부 파일로 다운로드)
import fs from "fs";
import { imagePath } from "../../../lib/galleryDb";

export default function handler(req, res) {
  const { session } = req.query;

  if (!session) {
    return res.status(403).json({ message: "forbidden" });
  }

  const filePath = imagePath(session);
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${session}.png"`
    );
    return fs.createReadStream(filePath).pipe(res);
  }

  return res.status(404).json({ message: "다음 이미지가 없어요." });
}

import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "../styles/n_blue.module.css";
import CopiesSelector from "../components/CopiesSelector";

// 블루 프레임 종류 (n_select 에서 ?frame= 로 넘어옴). 허용값만 사용, 기본 blue2.
const BLUE_FRAMES = ["blue0", "blue2"];

export default function NBlue() {
  // 정적 최적화 페이지라 router.query 가 초기 렌더에 비어 있어(하이드레이션 타이밍)
  // window.location.search 를 마운트 후 직접 읽는다. 기본값 blue2.
  const [frame, setFrame] = useState("blue2");

  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get("frame");
    if (BLUE_FRAMES.includes(f)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFrame(f);
    }
  }, []);

  const goSelectFrame = () => {
    window.location.href = `/take_photo-1?frame=${frame}`;
  };

  const goBack = () => {
    window.location.href = "/n_select";
  };

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>나만의 프레임</title>
      </Head>

      <div className={styles.blue}>
        <CopiesSelector />
        <div className={styles["rectangle-2"]}></div>

        <div className={styles.div2}>
          <div className={styles.div2}>
            <div className={styles["rectangle-6"]}></div>
            <div className={styles.div3} onClick={goSelectFrame}>
              이 프레임 선택하기
            </div>
          </div>
        </div>

        <div className={styles.div4}>
          <div className={styles["rectangle-3"]}></div>
          <Image
            className={styles.blue2}
            src={`/images/${frame}.png`}
            alt={frame}
            width={338}
            height={500}
          />
        </div>

        <div className={styles["select-page"]}>
          <div className={styles["rectangle-62"]}></div>
          <div className={styles.div5} onClick={goBack}>
            ← 뒤로가기
          </div>
        </div>

        <div className={styles.div6}>
          <div className={styles.blue3}>Waiting</div>
        </div>
      </div>
    </>
  );
}

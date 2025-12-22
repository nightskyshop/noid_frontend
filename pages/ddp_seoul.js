import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import styles from "../styles/ddp_seoul.module.css";

export default function DdpSeoul() {
  const goSelectFrame = () => {
    window.location.href = "/take_photo-1?frame=sjj_1";
  };

  const goBack = () => {
    window.location.href = "/ddp_select";
  };

  return (
    <>
      <Head>
        <title>단원진로학술제 프레임</title>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className={styles.seoulddp}>
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
            className={styles.seoulddp2}
            src="/images/sjj_1.png"
            alt="seoul ddp"
            width={500}
            height={700}
          />
        </div>

        <div className={styles["select-page"]}>
          <div className={styles["rectangle-62"]}></div>
          <div className={styles.div5} onClick={goBack}>
            ← 뒤로가기
          </div>
        </div>

        <div className={styles.div6}>
          <div className={styles["seoul-ddp"]}>Christmas</div>
        </div>
      </div>
    </>
  );
}

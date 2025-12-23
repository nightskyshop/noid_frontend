import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import styles from "../styles/n_blue.module.css";

export default function NBlue() {
  const goSelectFrame = () => {
    window.location.href = "/take_photo-1?frame=dankook_mbti";
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
            src="/images/dankook_mbti.png"
            alt="dankook_mbti"
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

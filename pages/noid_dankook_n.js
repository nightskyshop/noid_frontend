import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import styles from "../styles/noid_dankook_n.module.css";
import Snowfall from "react-snowfall";

export default function NoidDankookN() {
  const goSelectFrame = () => {
    window.location.href = "/take_photo-1?frame=dankook_n";
  };

  const goBack = () => {
    window.location.href = "/noid_select";
  };

  return (
    <>
      <Head>
        <title>NOID NAVY 프레임</title>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className={styles["dankook-n"]}>
        <Snowfall color="#82C3D9" />

        <div className={styles.div}>
          <div className={styles.div2}>
            <div className={styles["rectangle-2"]}></div>
            <div className={styles.div3} onClick={goSelectFrame}>
              이 프레임 선택하기
            </div>
          </div>
        </div>

        <div className={styles.div4}>
          <div className={styles["rectangle-3"]}></div>
          <Image
            className={styles["dankook-n2"]}
            src="/images/dankook_n.png"
            alt="dankook_n"
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
          <div className={styles["noid-navy"]}>NOID NAVY</div>
        </div>
      </div>
    </>
  );
}

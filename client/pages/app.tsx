import React from 'react';
import styles from '../styles/app.module.scss';
import Title from '../components/title.component';
import Paragraph from '../components/paragraph.component';
import img from '../assets/logo.png'

const App = () => (
  <div className={`${styles.margin_baseline}`}>
    <div className={`${styles.welcomeBlock} ${styles.align_middle}`}>
      <img src={img} className={`${styles.welcomeBlock} ${styles._grid}`} style={{marginTop: "-120px", width: "150px"}}/>
      <Title title={"powerfull ssr-framework"} styles={styles}></Title>
      <Paragraph text={"Get started by editing"} styles={styles} className={`${styles.welcomeBlock} ${styles._grid} ${styles.mt5}`}>
        <div className={`${styles.breadcrumb} ${styles.p_1} ${styles.px_2} ${styles.rounded_lg} ${styles.ml_2} ${styles.text_slate_500}`}>
          <b>client/index.tsx</b>
        </div>
      </Paragraph>
    </div>
  </div>
);

export default App;

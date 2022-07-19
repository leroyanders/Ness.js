import React from 'react';
import { Title } from '../components/title.component';
import { Paragraph } from '../components/paragraph.component';
import { PageMeta, Layout } from '../components/layout.component';
import { Helmet } from 'react-helmet';

// Home module stylesheet
import styles from '../styles/Home.module.css';

class Home extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <PageMeta>
        {/* PageMeta */}
        <Helmet>
          <title>Welcome to NessApp</title>
          <meta name="description" content="Thanks for installing this application!"></meta>
        </Helmet>
        {/* end PageMeta */}
        {/* PageBody */}
        <Layout>
          <div className={`${styles.margin_baseline} m-auto mt-0 text-center mx-5`}>
            <div className={`${styles.welcomeBlock} m-auto mt-0 text-center align_middle`}>
              <img src={"https://user-images.githubusercontent.com/106757584/175770221-a634f207-c3de-4afc-991c-d2fb32953941.png"} className={`${styles.welcomeBlock} m-auto mt-0 text-center grid`} style={{marginTop: "-120px", width: "150px"}}/>
              <Title title={"powerfull ssr-framework"}></Title>
              <h3 className={`${styles.welcomeBlock} m-auto mt-0 text-center mt-10`} style={{color: "grey"}}>Get started by editing:</h3>
              
              <div className={"flex m-auto w-1/4 mt-5"}>
                <Paragraph className={`${styles.welcomeBlock} m-auto mt-0 text-center grid`}>
                  <div className={"bg-slate-100 p-1 px-4 rounded-lg ml-2 text-slate-500"}>
                    <b>./src/client/router.js</b>
                  </div>
                </Paragraph>

                <Paragraph className={`${styles.welcomeBlock} m-auto mt-0 text-center grid`}>
                  <div className={"p-1 px-2 rounded-lg ml-2 text-slate-500"}>
                    <b>or</b>
                  </div>
                </Paragraph>

                <Paragraph className={`${styles.welcomeBlock} m-auto mt-0 text-center grid`}>
                  <div className={"bg-slate-100 p-1 px-4 rounded-lg ml-2 text-slate-500"}>
                    <b>./src/pages/Home.js</b>
                  </div>
                </Paragraph>
              </div>
              
              <div className="m-auto mt-5 px-2 rounded-lg ml-2 text-slate-500">
                <i>Thank you for installing</i>
              </div>
            </div>
          </div>
        </Layout>
        {/* end PageBody */}
      </PageMeta>
    );
  }
}

export default Home;
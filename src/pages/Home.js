import React from 'react';
import { Title } from '../components/title.component';
import { Paragraph } from '../components/paragraph.component';
import { Page, Layout, Head } from 'nessapp/next/ui';

// Home module stylesheet
import '../styles/Home.module.scss';

class Home extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Page>
        <Head>
          <title>Welcome to NessApp</title>
          <meta name="description" content="Thanks for installing this application!"></meta>
        </Head>
        <Layout>
          <div className={"margin_baseline m-auto mt-0 text-center mx-5 mr-10"}>
            <div className={"welcomeBlock m-auto mt-0 text-center align_middle"}>
              <img src={"https://user-images.githubusercontent.com/106757584/175770221-a634f207-c3de-4afc-991c-d2fb32953941.png"} className={"${styles.welcomeBlock} m-auto mt-0 text-center grid"} style={{marginTop: "-120px", width: "150px"}}/>
              <Title title={"powerfull ssr-framework"}></Title>
              <h3 className={"welcomeBlock m-auto mt-0 text-center mt-10"} style={{color: "grey"}}>Get started by editing:</h3>
              
              <div className={"flex m-auto w-1/4 mt-5"}>
                <Paragraph className={"welcomeBlock m-auto mt-0 text-center grid"}>
                  <div className={"bg-slate-100 p-1 px-4 rounded-lg ml-2 text-slate-500"}>
                    <b>./src/client/router.js</b>
                  </div>
                </Paragraph>

                <Paragraph className={"welcomeBlock m-auto mt-0 text-center grid"}>
                  <div className={"p-1 px-2 rounded-lg ml-2 text-slate-500"}>
                    <b>or</b>
                  </div>
                </Paragraph>

                <Paragraph className={"welcomeBlock m-auto mt-0 text-center grid"}>
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
      </Page>
    );
  }
}

export default Home;
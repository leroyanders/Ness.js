import React, { useState } from 'react';
import { Paragraph } from '../components/paragraph.component';
import { Page, Layout, Head } from 'nessapp/next/ui';
import { Helmet } from 'react-helmet';

// Home module stylesheet
import '../styles/Home.module.scss';

function Home(props) {
  const [state, setState] = useState(0);
  return (
    <Page>
      <Head>
        <Helmet>
          <title>Welcome to NessApp</title>
          <meta name="description" content="Thanks for installing this application!"></meta>
        </Helmet>
      </Head>
      <Layout>
        <div className={"margin_baseline m-auto mt-0 text-center mx-5 mr-10"}>
          <div className={"welcomeBlock m-auto mt-0 text-center align_middle"}>
            <img src={"https://user-images.githubusercontent.com/106757584/175770221-a634f207-c3de-4afc-991c-d2fb32953941.png"} className={"welcomeBlock m-auto mt-0 text-center grid"} style={{marginTop: "-120px", width: "150px"}}/>
            <h1 className='heading30 mt-5'>
              <b>Newest Experience of Server Side development. </b><br/> 
              <i>Awesome React framework!</i>
            </h1>

            <div className={"m-auto w-1/4 mt-5 text-center"}>
              <div className="m-auto mt-5 px-2 rounded-lg text-slate-500">
                <p>You clicked {state} times!</p>
              </div>
              <button 
                className={"text-blue-700 font-semibold hover:text-black py-2 px-4 border-transparent hover:border-transparent rounded"} 
                onClick={() => setState(state + 1)}>Make one more click!</button>
            </div>

            <h3 className={"welcomeBlock m-auto mt-0 text-center mt-10"} style={{color: "grey"}}>Get started by editing:</h3>
            
            <div className={"flex m-auto w-1/4 mt-5"}>
              <Paragraph className={"welcomeBlock m-auto mt-0 text-center grid"}>
                <div className={"bg-slate-100 p-1 px-4 rounded-lg ml-2 text-slate-500"}>
                  <b>./src/router.js</b>
                </div>
              </Paragraph>

              <Paragraph className={"welcomeBlock m-auto mt-0 text-center grid"}>
                <div className={"p-1 px-2 rounded-lg ml-2 text-slate-500"}>
                  <b>or</b>
                </div>
              </Paragraph>

              <Paragraph className={"welcomeBlock m-auto mt-0 text-center grid"}>
                <div className={"bg-slate-100 p-1 px-4 rounded-lg ml-2 text-slate-500"}>
                  <b>./src/index.js</b>
                </div>
              </Paragraph>
            </div>
          </div>
        </div>
      </Layout>
    </Page>
  );
}

export default Home;
import React from 'react';
import axios from 'axios';

// Page layout
import { Helmet } from 'react-helmet';
import { Page, Layout, Head } from 'nessapp/next/ui';
import { NessComponent } from 'nessapp/types/component';

// Home module stylesheet
import '../styles/Home.module.scss';

class Home extends React.Component <NessComponent> {
  constructor(props) {
    super(props);
  }

  static useServerSideFetching() {
    return {
      users: axios.get('https://jsonplaceholder.typicode.com/users'),
      posts: axios.get('https://jsonplaceholder.typicode.com/posts'),
    }
  }

  render() {
    const { application: { name } } = this.props.useServerSideProps();

    return (
      <Page>
        <Head>
          <Helmet>
            <title>{`Welcome | ${name}`}</title>
            <meta name="description" content="Thanks for installing this application!"></meta>
          </Helmet>
        </Head>
        <Layout>
          <div className="h-full absolute w-full">
            <div className="absolute main text-center py-10 m-auto w-full" style={{left: '50%', top: '50%', transform: 'translate(-50%,-50%)'}}>
              <div className="container w-6/12 mx-auto">
                <h1 className="text-[50px] font-normal">
                  Welcome to <font className="text-blue-700">{name}!</font>
                </h1>
                
                <p>Newest Experiences of Server Side development 🌱</p>
                
                <p className="p-5 mt-5 p-6 bg-white rounded-2xl text-gray-600">
                  Get started by editing: <span className="p-2 ml-2 rounded-full px-4 text-slate-700 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">./src/pages/Home.js</span>
                </p>

                <div className="grid w-fit grid-cols-2 mx-auto mt-0">
                  {/* Documentation */}
                  <div className="p-6 max-w-sm bg-white rounded-2xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 m-5">
                    <a href="https://nessapp.vercel.app/docs/" target="_blank">
                      <h5 className="mb-2 text-2xl font-medium tracking-tight text-gray-900 dark:text-white">Documentation</h5>
                    </a>
                    <p className="mb-3 mt-5 font-normal text-gray-600 dark:text-gray-400">Here's the most important features of Ness.js, difference using static React.js. And also helpful examples.</p>
                  </div>

                  {/* Examples */}
                  <div className="p-6 max-w-sm bg-white rounded-2xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700 m-5">
                    <a href="https://nessapp.vercel.app/docs/examples" target="_blank">
                      <h5 className="mb-2 text-2xl font-medium tracking-tight text-gray-900 dark:text-white">Examples</h5>
                    </a>
                    <p className="mb-3 mt-5 font-normal text-gray-600 dark:text-gray-400">Here's the most helpful examples of Ness.js, which would help me create something in a short time.</p>
                  </div>
                </div>

                <a href="https://nessapp.vercel.app/docs/" target="_blank" className="text-right mt-5 inline-flex items-center py-2 px-4 text-sm font-medium text-center text-white bg-blue-700 rounded-full hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                  <font>Explore</font>
                  <svg aria-hidden="true" className="ml-2 -mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                </a>
                
                <p className="text-gray-500 mt-20">If you find this tool helful, please <a href="https://github.com/leroywagner/Ness.js" className="text-blue-700" target="_blank">give me a start</a>.</p>
              </div>
            </div>

            <div className="p-5 text-center border-t-[1px] border-gray-200 shadow-xl dark:bg-gray-800 dark:border-gray-700 fixed bottom-[0] w-full">
              <div className="inline-flex mx-auto">
                <div className="my-auto mr-2 mt-[4px] text-gray-500">Made with love by:</div>
                <a href="http://github.com/leroywagner" target="_blank" className="flex">
                  <b className="inline-flex border-[1px] p-1 px-[5px] rounded-full pr-5 font-medium">
                    <img src={"https://avatars.githubusercontent.com/u/106757584?v=4"} className="w-[25px] h-[25px] mt-[0px] rounded-full mr-2"/>
                    Leroy Wagner
                    <svg aria-hidden="true" className="ml-2 -mr-1 w-4 h-4 my-auto" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                  </b>
                </a>
              </div>
            </div>

          </div>
        </Layout>
      </Page>
    );
  }
}

export default Home;
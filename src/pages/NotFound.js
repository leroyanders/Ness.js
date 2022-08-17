import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

// layout
import { Page, Layout, Head } from 'nessapp/next/ui';

// components
import Header from '../components/ui/Header';
import Container from '../components/ui/Container';
import Flex from '../components/ui/Flex';
import Navbar from '../components/ui/Navbar';

// Home module stylesheet
import '../styles/Home.module.scss';

function QuickStart(props) {
  return (
    <Page>
      <Head>
        <Helmet>
          <title>Not Found | NessApp</title>
          <meta name="description" content="Thanks for installing this application!"></meta>
        </Helmet>
      </Head>
      <Layout>
        <Header active="getting-started"/>
            <div className="m-auto w-full">
                <main className="p-10 pt-0 m-auto mt-20">
                    <div className="m-auto mb-10 font-light pb-2 text-center">
                        <h1 className="text-[60px]">404</h1>
                        <h1 className="text-[40px]">Page was not found</h1>
                        <p className="text-slate-500 mt-2">We are sorry, but that's what we have :(</p>
                    </div>
                </main>
            </div>
      </Layout>
    </Page>
  );
}

export default QuickStart;
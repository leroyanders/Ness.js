import React from 'react';
import { Helmet } from 'react-helmet';
// layout
import { Page, Layout, Head } from 'nessapp/next/ui';
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
        <h1>404</h1>
      </Layout>
    </Page>
  );
}

export default QuickStart;
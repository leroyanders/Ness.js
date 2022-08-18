import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { Helmet } from 'react-helmet';

// layout
import { Page, Layout, Head } from 'nessapp/next/ui';

// components
import Header from '../components/ui/Header';
import Container from '../components/ui/Container';
import Flex from '../components/ui/Flex';
import Navbar from '../components/ui/Navbar';

// Home module stylesheet
import '../styles/Home.module.scss';

function Documentation(props) {
  return (
    <Page>
      <Head>
        <Helmet>
          <title>Documentation | NessApp</title>
          <meta name="description" content="Thanks for installing this application!"></meta>
        </Helmet>
      </Head>
      <Layout>
        <Header active="documentation"/>
        <Container>
          <div className="m-auto w-[100%] block">
            <Flex>
              <Navbar>
                <ul className="h-[100%] p-0 bg-slate-0 rounded-md ml-9 border-r border-slate-200 rounded-r-none sticky xs:w-[100%] xs:ml-0 xs:m-4 xs:bg-slate-50 sm:w-[100%] sm:ml-0 sm:m-4 sm:bg-slate-50">
                  {/* Introduction */}
                  <li className="text-slate-200 rounded-lg p-3 px-4 text-[15px]">
                    <div className="bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]">
                        <Link to={"/"}>Introduction</Link>
                    </div>
                    <ul className="ml-5">
                      <li className="rounded-md p-3 text-slate-500 px-4 text-[15px]">
                        <a href="#about">
                          - What is Ness.js?
                        </a>
                      </li>
                      <li className="rounded-md p-3 text-slate-500 px-4 text-[15px]">
                        <a href="#why-to-use">
                          - Why to use Ness.js?
                        </a>
                      </li>
                      <li className="rounded-md p-3 text-slate-500 px-4 text-[15px]">
                        <a href="#development-experience">
                          - Development experience
                        </a>
                      </li>
                      <li className="rounded-md p-3 text-slate-500 px-4 text-[15px]">
                        <a href="https://github.com/leroywagner/Ness.js/issues" target={"_blank"}>
                          - Create an issue
                        </a>
                      </li>
                    </ul>
                  </li>
                  {/* Getting Started */}
                  <li className="text-slate-200 rounded-lg p-3 px-4 text-[15px]">
                    <div className="bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]">
                        <Link to={"/getting-started"}>Getting Started</Link>
                    </div>
                    <ul className="ml-5">
                      <li className="rounded-md p-3 text-slate-500 px-4 text-[15px]">
                        <a href="#quick-start">
                          - Installing Ness CLI
                        </a>
                      </li>
                      <li className="rounded-md p-3 text-slate-500 px-4 text-[15px]">
                        <a href="#why-to-use">
                          - Setup a new application
                        </a>
                      </li>
                      <li className="rounded-md p-3 text-slate-500 px-4 text-[15px]">
                        <a href="#development-experience">
                          - Commands
                        </a>
                      </li>
                      <li className="rounded-md p-3 text-slate-500 px-4 text-[15px]">
                        <a href="#development-experience">
                          - Plugins
                        </a>
                      </li>
                    </ul>
                  </li>
                  {/* Documentation */}
                  <li className="active text-slate-200 rounded-lg p-3 px-4 text-[15px]">
                    <div className="bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]">
                        <Link to={"/documentation"}>Documentation</Link>
                    </div>
                  </li>
                </ul>
              </Navbar>
              <main className="ml-10 w-[50%] p-10 pt-0 xs:ml-0 xs:w-[100%] sm:ml-0 sm:w-[100%]">
                <div className="mb-10 font-light pb-2 text-center">
                  <h1 className="text-[40px]">Documentation</h1>
                  <p className="text-slate-500 mt-2">Documentation will be available later, we are sorry.</p>
                </div>
                <div className="mt-10">
                  <Flex>
                    <Link to={"/getting-started"} className="ml-auto inline-flex items-center py-2 px-4 mr-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                        <svg aria-hidden="true" className="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd"></path></svg>
                        Previous: Getting Started
                    </Link>
                  </Flex>
                </div>
              </main>
            </Flex>
          </div>
        </Container>
      </Layout>
    </Page>
  );
}

export default Documentation;
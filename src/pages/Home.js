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

function Home(props) {
  return (
    <Page>
      <Head>
        <Helmet>
          <title>Introduction | NessApp</title>
          <meta name="description" content="Thanks for installing this application!"></meta>
        </Helmet>
      </Head>
      <Layout>
        <Header active="default"/>
        <Container>
          <div className="m-auto">
            <Flex>
              <Navbar>
                <ul className="h-[100%] p-0 bg-slate-0 rounded-md ml-9 border-r border-slate-200 rounded-r-none sticky xs:w-[100%] xs:ml-0 xs:m-4 xs:bg-slate-50 sm:w-[100%] sm:ml-0 sm:m-4 sm:bg-slate-50">
                  {/* Introduction */}
                  <li className="active text-slate-200 rounded-lg p-3 px-4 text-[15px]">
                    <div className="bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]">
                        <Link to={"/"}>Introduction</Link>
                    </div>
                    <ul className="ml-5 xs:ml-0 sm:ml-0">
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
                  <li className="text-slate-200 rounded-lg p-3 px-4 text-[15px]">
                    <div className="bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]">
                        <Link to={"/documentation"}>Documentation</Link>
                    </div>
                  </li>
                </ul>
              </Navbar>
              <main className="ml-10 w-[50%] p-10 pt-0 xs:ml-0 xs:w-[100%] sm:ml-0 sm:w-[100%]">
                <div className="mb-10 font-light pb-2">
                  <h1 className="text-[40px]">Introduction</h1>
                  <p className="text-slate-500 mt-2">Get started with the open-source framework of React experience and interactive UI components built with the utility classes from Tailwind CSS</p>
                </div>
                <div className="bg-slate-0 p-0 rounded-lg">
                  <div>
                    <h2 id="about">
                      <button type="button" className="flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white" data-accordion-target="#accordion-flush-body-1" aria-expanded="true" aria-controls="accordion-flush-body-1">
                        <span>What is Ness.js?</span>
                      </button>
                    </h2>
                    <div id="accordion-flush-body-1" className="" aria-labelledby="accordion-flush-heading-1">
                      <div className="py-5 font-light border-b border-gray-200 dark:border-gray-700">
                        <p className="mb-2 text-gray-500 dark:text-gray-400">Ness.js is an open-source framework of React experience and interactive UI components built with the utility classes from Tailwind CSS. It supports both-side rendering without missmatches on client-side and server-side.</p>
                        <p className="text-gray-500 dark:text-gray-400">Check out this guide to learn how to <a href="/getting-started" className="text-blue-600 dark:text-blue-500 hover:underline">get started</a> and start developing websites even faster.</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h2 id="why-to-use">
                      <button type="button" className="flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white" data-accordion-target="#accordion-flush-body-1" aria-expanded="true" aria-controls="accordion-flush-body-1">
                        <span>Why to use Ness.js?</span>
                      </button>
                    </h2>
                    <div id="accordion-flush-body-1" className="" aria-labelledby="accordion-flush-heading-1">
                      <div className="py-5 font-light border-b border-gray-200 dark:border-gray-700">
                        <p className="mb-2 text-gray-500 dark:text-gray-400">Ness.js will allow you to create modern SPA applications without any extra knowledge, only with experience in creating <a href="https://create-react-app.dev/" className="text-blue-600 dark:text-blue-500 hover:underline">create-react-app</a>.</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h2 id="development-experience">
                      <button type="button" className="flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white" data-accordion-target="#accordion-flush-body-1" aria-expanded="true" aria-controls="accordion-flush-body-1">
                        <span>Development experience</span>
                      </button>
                    </h2>
                    <div id="accordion-flush-body-1" className="" aria-labelledby="accordion-flush-heading-1">
                      <div className="py-5 font-light border-b border-gray-200 dark:border-gray-700">
                        <p className="mb-2 text-gray-500 dark:text-gray-400">You do not have to buy various solutions, development and assembly of your application takes place in real time using the popular HOT Module Replacement(HMR) and also saves time writing styling. As practice has shown, writing a complex application takes less than a week.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-10">
                  <Flex>
                    <Link to={"/getting-started"} className="ml-auto xs:text-[8px] inline-flex items-center py-2 px-4 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                      Next: Getting Started
                      <svg aria-hidden="true" className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
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

export default Home;
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
          <title>Getting Started | NessApp</title>
          <meta name="description" content="Thanks for installing this application!"></meta>
        </Helmet>
      </Head>
      <Layout>
        <Header active="getting-started"/>
        <Container>
          <div className="m-auto">
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
                  <li className="active text-slate-200 rounded-lg p-3 px-4 text-[15px]">
                    <div className="bg-slate-100 rounded-md p-3 text-slate-600 px-4 text-[15px]">
                        <Link to={"/getting-started"}>Getting Started</Link>
                    </div>
                    <ul className="ml-5 xs:ml-0 sm:ml-0">
                      <li className="rounded-md p-3 text-slate-500 px-4 text-[15px]">
                        <a href="#install-cli">
                          - Installing Ness CLI
                        </a>
                      </li>
                      <li className="rounded-md p-3 text-slate-500 px-4 text-[15px]">
                        <a href="#setup-project">
                          - Setup a new application
                        </a>
                      </li>
                      <li className="rounded-md p-3 text-slate-500 px-4 text-[15px]">
                        <a href="#commands">
                          - Commands
                        </a>
                      </li>
                      <li className="rounded-md p-3 text-slate-500 px-4 text-[15px]">
                        <a href="#plugins">
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
                  <h1 className="text-[40px]">Getting Started</h1>
                  <p className="text-slate-500 mt-2">Installation, commands and plugins.</p>
                </div>
                <div className="bg-slate-0 p-0 rounded-lg">
                  <div>
                    <h2 id="install-cli">
                      <button type="button" className="flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white" data-accordion-target="#accordion-flush-body-1" aria-expanded="true" aria-controls="accordion-flush-body-1">
                        <span>Installing Ness CLI</span>
                      </button>
                    </h2>
                    <div id="accordion-flush-body-1" className="" aria-labelledby="accordion-flush-heading-1">
                        <div className="py-5 font-light border-b border-gray-200 dark:border-gray-700">
                            <p className="mb-4 text-gray-500 dark:text-gray-400">Use command below for installing client, you may use: npx, npm & yarn:</p>
                            <pre className="text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600">
                                <code className="prism-code language-sh">
                                    <div className="token-line">
                                        <span className="token plain">$ npm install -g create-ness-app@latest</span>
                                    </div>
                                </code>
                            </pre>
                            <pre className="text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600">
                                <code className="prism-code language-sh">
                                    <div className="token-line">
                                        <span className="token plain">$ npx create-ness-app</span>
                                    </div>
                                </code>
                            </pre>
                            <p className="p-4 border-l-4 border-slate-100 my-5 py-2 text-slate-500">
                                Note that we prefer using npx, because of latest version. If you will using npx go next step
                            </p>
                            <pre className="text-[14px] bg-slate-100 rounded-lg p-5 text-slate-600">
                                <code className="prism-code language-sh">
                                    <div className="token-line">
                                        <span className="token plain">$ yarn global add create-ness-app@latest</span>
                                    </div>
                                </code>
                            </pre>
                            <p className="mt-5 text-gray-500 dark:text-gray-400 code-description">
                                If you've previously installed
                                <code>create-ness-app</code>globally using 
                                <code>npm install -g create-ness-app</code>, we recommend you uninstall the package by
                                <code>npm uninstall -g create-ness-app</code>or
                                <code>yarn global remove create-ness-app</code>to ensure that npx always uses the latest version.
                            </p>
                        </div>
                    </div>
                  </div>
                  <div>
                    <h2 id="setup-project">
                      <button type="button" className="flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white" data-accordion-target="#accordion-flush-body-1" aria-expanded="true" aria-controls="accordion-flush-body-1">
                        <span>Setup a new application</span>
                      </button>
                    </h2>
                    <div id="accordion-flush-body-1" className="" aria-labelledby="accordion-flush-heading-1">
                      <div className="py-5 font-light border-b border-gray-200 dark:border-gray-700">
                        <p className="mb-2 text-gray-500 dark:text-gray-400">Now you abble to setup a new project, use next command:</p>
                            <pre className="text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600">
                                <code className="prism-code language-sh">
                                    <div className="token-line">
                                        <span className="token plain">$ npx create-ness-app</span>
                                    </div>
                                </code>
                            </pre>
                            <p className="p-4 border-l-4 border-slate-100 my-5 py-2 text-slate-500">or (by default)</p>
                            <pre className="text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600">
                                <code className="prism-code language-sh">
                                    <div className="token-line">
                                        <span className="token plain">$ create-ness-app</span>
                                    </div>
                                </code>
                            </pre>
                        <p className="mb-2 text-gray-500 dark:text-gray-400 mt-5">Now you must set project name and location where to setup. For example:</p>
                        <pre className="text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600">
                            <code className="prism-code language-sh">
                                <div className="token-line">
                                    <span className="token plain">
                                        <i className="text-slate-500">How we will name your project?(ness-app):</i> ness-app
                                    </span>
                                </div>
                                <div className="token-line">
                                    <span className="token plain">
                                        <i className="text-slate-500">Where do you want to locate your project?(current directory):</i>
                                    </span>
                                </div>
                                <br/>
                                <div className="token-line !color-slate-400">
                                    <span className="token plain">
                                        <i className="text-slate-400">Creating ness.js app ness-app in ness-app</i>
                                    </span>
                                </div>
                            </code>
                        </pre>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h2 id="commands">
                      <button type="button" className="flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white" data-accordion-target="#accordion-flush-body-1" aria-expanded="true" aria-controls="accordion-flush-body-1">
                        <span>Availbale commands</span>
                      </button>
                    </h2>
                    <div id="accordion-flush-body-1" className="" aria-labelledby="accordion-flush-heading-1">
                        <div>
                            <p className="mb-2 text-gray-700 dark:text-gray-300 mt-5">Running development server with hot-reload on port 3000</p>
                            <pre className="text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600">
                                <code className="prism-code language-sh">
                                    <div className="token-line">
                                        <span className="token plain">$ npm run start</span>
                                    </div>
                                </code>
                            </pre>
                        </div>
                        <div>
                            <p className="mb-2 text-gray-700 dark:text-gray-300 mt-5">Building server</p>
                            <p className="mb-2 text-gray-500 dark:text-gray-400 mt-5 code-description">You may pass<code>NODE_ENV=production</code>directly or<code>NODE_ENV=development</code></p>
                            <pre className="text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600">
                                <code className="prism-code language-sh">
                                    <div className="token-line">
                                        <span className="token plain">$ npm run build</span>
                                    </div>
                                </code>
                            </pre>
                        </div>
                        <div>
                            <p className="mb-2 text-gray-700 dark:text-gray-300 mt-5">Generate component, hook, page and others</p>
                            <p className="mb-2 text-gray-500 dark:text-gray-400 mt-5 code-description">Available types:</p>
                            <div className="mt-2">
                                <div className="flex">
                                    <div className="p-2 border-[1.5px] border-slate-100 rounded-lg mr-2 py-1">page</div>
                                    <div className="p-2 border-[1.5px] border-slate-100 rounded-lg mr-2 py-1">hook</div>
                                    <div className="p-2 border-[1.5px] border-slate-100 rounded-lg mr-2 py-1">service</div>
                                    <div className="p-2 border-[1.5px] border-slate-100 rounded-lg mr-2 py-1">component</div>
                                </div>
                            </div>
                            <p className="mb-2 text-gray-500 dark:text-gray-400 mt-5 code-description">Example:</p>
                            <pre className="text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600">
                                <code className="prism-code language-sh">
                                    <div className="token-line">
                                        <span className="token plain">$ nessapp generate *type* *path*</span>
                                    </div>
                                </code>
                            </pre>
                        </div>
                        <div>
                            <p className="mb-2 text-gray-700 dark:text-gray-300 mt-5">Start production server</p>
                            <pre className="text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600">
                                <code className="prism-code language-sh">
                                    <div className="token-line">
                                        <span className="token plain">$ npm run start:prod</span>
                                    </div>
                                </code>
                            </pre>
                        </div>
                        <div>
                            <p className="mb-2 text-gray-700 dark:text-gray-300 mt-5">Start testing</p>
                            <pre className="text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600">
                                <code className="prism-code language-sh">
                                    <div className="token-line">
                                        <span className="token plain">$ npm run test</span>
                                    </div>
                                </code>
                            </pre>
                        </div>
                    </div>
                    <div>
                        <h2 id="plugins">
                            <button type="button" className="flex items-center justify-between w-full py-5 font-medium text-left dark:border-gray-700 dark:bg-gray-900 text-gray-900 dark:text-white" data-accordion-target="#accordion-flush-body-1" aria-expanded="true" aria-controls="accordion-flush-body-1">
                                <span>Plugins</span>
                            </button>
                        </h2>
                        <div id="accordion-flush-body-1" className="" aria-labelledby="accordion-flush-heading-1">
                            <div className="py-5 font-light border-b border-gray-200 dark:border-gray-700">
                                <div>
                                    <b className="mb-4 code-description text-slate-500">After installing plugins include them in<code>ness.config.js</code></b>
                                    <pre className="mt-5 text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600">
                                        <code className="prism-code language-js">
                                            <div className="token-line">
                                                <span className="token plain" style={{color: "rgb(233, 30, 99)"}}>module</span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>.</span>
                                                <span className="token property-access">exports</span>
                                                <span className="token plain"> </span>
                                                <span className="token operator" style={{color: "rgb(51, 51, 51)"}}>=</span>
                                                <span className="token plain"> </span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>{"{"}</span>
                                                <span className="token plain"></span>
                                            </div>
                                            <div className="token-line">
                                                <span className="token plain">  plugins</span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>:</span>
                                                <span className="token plain"> </span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>[</span>
                                                <span className="token plain"></span>
                                            </div>
                                            <div className="token-line">
                                                <span className="token plain">    </span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>{"{"}</span>
                                                <span className="token plain"></span>
                                            </div>
                                            <div className="token-line">
                                                <span className="token plain">      name</span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>:</span>
                                                <span className="token plain"> </span>
                                                <span className="token string" style={{color: "rgb(2, 130, 101)"}}>'tailwind'</span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>,</span>
                                                <span className="token plain"></span>
                                            </div>
                                            <div className="token-line">
                                                <span className="token plain">      options</span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>:</span>
                                                <span className="token plain"> </span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>{"{"}</span>
                                                <span className="token plain"></span>
                                            </div>
                                            <div className="token-line">
                                                <span className="token plain">        postcss</span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>:</span>
                                                <span className="token plain"> </span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>{"{"}</span>
                                                <span className="token plain"></span>
                                            </div>
                                            <div className="token-line">
                                                <span className="token plain">          dev</span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>:</span>
                                                <span className="token plain"> </span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>{"{"}</span>
                                                <span className="token plain"></span>
                                            </div>
                                            <div className="token-line">
                                                <span className="token plain">            sourceMap</span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>:</span>
                                                <span className="token plain"> </span>
                                                <span className="token boolean" style={{color: "rgb(217, 147, 30)"}}>true</span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>,</span>
                                                <span className="token plain"></span>
                                            </div>
                                            <div className="token-line">
                                                <span className="token plain">          </span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>{"}"}</span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>,</span>
                                                <span className="token plain"></span>
                                            </div>
                                            <div className="token-line">
                                                <span className="token plain">        </span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>{"}"}</span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>,</span>
                                                <span className="token plain"></span>
                                            </div>
                                            <div className="token-line">
                                                <span className="token plain">      </span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>{"}"}</span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>,</span>
                                                <span className="token plain"></span>
                                            </div>
                                            <div className="token-line">
                                                <span className="token plain">    </span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>{"}"}</span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>,</span>
                                                <span className="token plain"></span>
                                            </div>
                                            <div className="token-line">
                                                <span className="token plain">  </span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>]</span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>,</span>
                                                <span className="token plain"></span>
                                            </div>
                                            <div className="token-line">
                                                <span className="token plain"></span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>{"}"}</span>
                                                <span className="token punctuation" style={{color: "rgb(51, 51, 51)"}}>;</span>
                                            </div>
                                        </code>
                                    </pre>                                
                                </div>
                            </div>
                        </div>
                        <div id="accordion-flush-body-1" className="" aria-labelledby="accordion-flush-heading-1">
                            <div className="py-5 font-light border-b border-gray-200 dark:border-gray-700">
                                <p className="mb-4 text-gray-500 dark:text-gray-400">Available plugins:</p>

                                <div>
                                    <b className="mb-4">Plugin ness-tailwind will setup tailwind in your application, it using SASS.</b>
                                    <pre className="mt-4 text-[14px] bg-slate-100 rounded-lg p-5 mb-2 text-slate-600">
                                        <code className="prism-code language-sh">
                                            <div className="token-line">
                                                <span className="token plain">$ npm install ness-tailwind@latest</span>
                                            </div>
                                        </code>
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
                <div className="mt-10">
                  <div className="flex">
                    <Link to={"/"} className="xs:text-[8px] mr-auto inline-flex items-center py-2 px-4 mr-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                        <svg aria-hidden="true" className="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd"></path></svg>
                        Previous: Introduction
                    </Link>
                    <Link to={"/documentation"} className="xs:text-[8px] ml-auto inline-flex items-center py-2 px-4 mr-3 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                        Next: Documentation
                        <svg aria-hidden="true" className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                    </Link>
                  </div>
                </div>
              </main>
            </Flex>
          </div>
        </Container>
      </Layout>
    </Page>
  );
}

export default QuickStart;
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import useLocalStorage from '../../../hooks/useLocalStorage';

function Header(props) {
    const seacrhInput = useRef(null);
    // save shemaMode 
    const [mode, setMode] = useLocalStorage('schema-mode', 'undefined');

    let keysPressed = {}

    const focusSearch = (e) => {
        e.preventDefault();
        seacrhInput.current.focus();
    }

    const handleKeyUnPress = useCallback((event) => {
        delete keysPressed[event.key];
    }, []);

    // handle what happens on key press
    const handleKeyPress = useCallback((event) => {
        keysPressed[event.key] = true;
     
        if (keysPressed['Control'] || keysPressed['Meta'] && event.key === 'k') {
            focusSearch(event);
        }
    }, []);

    function toogleSchema(schema) {
        if(schema === 'dark') {
            setMode('dark');
            document.body.classList.add('dark')
        } else {
            setMode('light');
            document.body.classList.remove('dark');
        }
    }

    useEffect(() => {
        // attach the event listener
        document.addEventListener('keydown', handleKeyPress);
        document.addEventListener('keyup', handleKeyUnPress);

        // detect mode changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            if (event.matches) {
                document.body.classList.add('dark');
                setMode('dark');
            } else {
                document.body.classList.remove('dark');
                setMode('light');
            }
        });

        // set mode className to body
        toogleSchema(mode === 'underlined'? window.matchMedia('(prefers-color-scheme: dark)').matches? 'dark' : 'light' : mode);

        // remove the event listener
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
            document.removeEventListener('keyup', handleKeyUnPress);
        };
    }, [handleKeyPress]);

    return (
        <header className="sticky">
            <div className="p-[12px] text-center bg-[#2a425c] text-white xs:text-[12px] xs:p-[13px] dark:bg-[#1f2628]">
                Support Ukraine 🇺🇦 <a target="_blank" rel="noopener noreferrer" href="https://opensource.facebook.com/support-ukraine" className="underline"> Help Provide Humanitarian Aid to Ukraine</a>.
            </div>
            <div className="mb-4 border-b border-gray-200 dark:border-gray-700 px-10 xs:px-2 dark:bg-[#2C3639]">
                <div className="flex">
                    <div className="flex w-[33%]">
                        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" id="myTab" data-tabs-toggle="#myTabContent" role="tablist">
                            <li className="mr-20 justify-content flex" role="presentation">
                                <Link to={"/"} className="text-[20px] inline-block p-4 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 dark:hover:text-gray-300 pointer text-[#4277ad] dark:text-slate-400" id="home" data-tabs-target="#home" type="button" role="tab" aria-controls="profile" aria-selected="false">
                                    <b>Ness.js</b>
                                </Link>
                                <span className="text-[13px] text-slate-500 my-auto xs:hidden sm:hidden md:hidden">
                                    Newest Experience of Server Side development.
                                </span>
                            </li>
                        </ul>
                    </div>
                    <div className="flex w-[33%] xs:hidden sm:hidden md:hidden">
                        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" id="myTab" data-tabs-toggle="#myTabContent" role="tablist">
                            <li className="mr-2" role="presentation">
                               <Link to={"/"}>
                                    <button className={`dark:text-slate-400 inline-block p-4 rounded-t-lg border-b-2 ${ props.active !== 'default'? 'border-transparent' : ''} hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300`} id="profile-tab" data-tabs-target="#profile" type="button" role="tab" aria-controls="profile" aria-selected="false">Introduction</button>
                               </Link>
                            </li>
                            <li className="mr-2" role="presentation">
                                <Link to={"/getting-started"}>
                                    <button className={`dark:text-slate-400 inline-block p-4 rounded-t-lg border-b-2 ${ props.active !== 'getting-started'? 'border-transparent' : ''} hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300`} id="dashboard-tab" data-tabs-target="#dashboard" type="button" role="tab" aria-controls="dashboard" aria-selected="false">Getting Started</button>
                                </Link>
                            </li>
                            <li className="mr-2" role="presentation">
                                <Link to={"/documentation"}>
                                    <button className={`dark:text-slate-400 inline-block p-4 rounded-t-lg border-b-2 ${ props.active !== 'documentation'? 'border-transparent' : ''} hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300`} id="settings-tab" data-tabs-target="#settings" type="button" role="tab" aria-controls="settings" aria-selected="false">Documentation</button>
                                </Link>
                            </li>
                            <li role="presentation">
                                <a href={"https://github.com/firstcontributions/first-contributions"}>
                                    <button className={`dark:text-slate-400 inline-block p-4 rounded-t-lg border-b-2 ${ props.active !== 'contributing'? 'border-transparent' : ''} hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300`} id="contacts-tab" data-tabs-target="#contacts" type="button" role="tab" aria-controls="contacts" aria-selected="false">Contributing</button>
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="flex w-[33%] xs:ml-auto xs:w-[67%] sm:ml-auto sm:w-[67%] md:ml-auto md:w-[67%]">
                        <nav className="mt-1.5 ml-auto">
                            <div className="flex">
                                <nav className="mr-5 flex">
                                    <a href="https://github.com/leroywagner/Ness.js" data-tooltip-target="tooltip-github-2" className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5 mr-1">
                                        <svg className="w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="github" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><path fill="currentColor" d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"></path></svg>
                                        <span className="sr-only">View on Github</span>
                                    </a>
                                    { 
                                        mode === 'dark' ? 
                                            <button type="button" onClick={() => toogleSchema('light')} className="xs:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5 inline-flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="w-5 h-5"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"></path></svg>
                                            </button>
                                        :
                                            <button type="button" onClick={() => toogleSchema('dark')} className="xs:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5 inline-flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="w-5 h-5"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                                            </button>
                                    }
                                </nav>
                                <form>   
                                    <label htmlFor="search" className="mb-3 text-sm font-medium text-gray-900 sr-only dark:text-gray-300">Your Email</label>
                                    <div className="relative flex mt-[1px]">
                                        <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                                            <svg aria-hidden="true" className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                        </div>
                                        <input ref={seacrhInput} type="search" id="search" className="w-[100%] dark:border-none dark:bg-[#1f2628] lock p-2 pl-10 text-sm text-gray-500 bg-gray-100 rounded-lg border border-gray-200 focus:ring-blue-500 focus:border-blue-500" placeholder="Search"/>
                                        <button onClick={focusSearch} style={{'marginTop': '4.8px'}} className="border-gray-300 text-slate-500 absolute right-1.5 m-auto hover:bg-slate-200 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-1 py-1 dark:bg-[#2C3639] dark:hover:bg-blue-700 dark:focus:ring-blue-800">⌘K</button>
                                    </div>
                                </form>
                            </div>
                        </nav>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Header
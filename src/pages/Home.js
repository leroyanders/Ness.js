import React from 'react';
import { Link } from 'react-router-dom';
import { Title } from '../components/title.component';
import { Paragraph } from '../components/paragraph.component';

import '../styles/layout.css';

class Home extends React.Component {
  render() {
    return (
      <div className={"margin_baseline"}>
        <div className={"welcomeBlock align_middle"}>
          <img src={"https://user-images.githubusercontent.com/106757584/175770221-a634f207-c3de-4afc-991c-d2fb32953941.png"} className={"welcomeBlock grid"} style={{marginTop: "-120px", width: "150px"}}/>
          <Title title={"powerfull ssr-framework"}></Title>
          <h3 className={"welcomeBlock mt5"} style={{color: "grey"}}>Get started by editing:</h3>
          <Paragraph className={"welcomeBlock _grid mt5"}>
            <div className={"breadcrumb p_1 px_2 rounded_lg ml_2 text_slate_500"}>
              <b>src/client/router.js</b>
            </div>
          </Paragraph>
          <text style={{color: "grey"}}>or</text>
          <Paragraph className={"welcomeBlock _grid"}>
            <div className={"breadcrumb p_1 px_2 rounded_lg ml_2 text_slate_500"}>
              <b>src/pages/Home.js</b>
            </div>
          </Paragraph>
        </div>
      </div>
    );
  }
}

export default Home;

import React from 'react';
import { Title } from '../components/title.component';
import { Paragraph } from '../components/paragraph.component';

export class App extends React.Component {
    constructor() {
      super();
    }
    render() {
        return (
          <div className={"margin_baseline"}>
            <div className={"welcomeBlock align_middle"}>
              <img src={"/static/assets/logo.png"} className={"welcomeBlock grid"} style={{marginTop: "-120px", width: "150px"}}/>
              <Title title={"powerfull ssr-framework"}></Title>
              <Paragraph text={"Get started by editing"} className={"welcomeBlock _grid mt5"}>
                <div className={"breadcrumb p_1 px_2 rounded_lg ml_2 text_slate_500"}>
                  <b>client/index.tsx</b>
                </div>
              </Paragraph>
            </div>
          </div>
        );
    }
}
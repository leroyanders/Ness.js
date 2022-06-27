import React from 'react';
import { Title } from '../components/title.component';
import { Paragraph } from '../components/paragraph.component';

export class Error404 extends React.Component {
    constructor() {
      super();
    }
    render() {
        return (
            <>
                <h1 style={{textAlign: 'center'}}>404</h1>
                <h1 style={{textAlign: 'center'}}>Page not found</h1>
            </>
        );
    }
}
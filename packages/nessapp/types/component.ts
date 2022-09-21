import React from 'react';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            font: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}

export type NessComponent = { 
    useServerSideProps: () => {
        [key: string]: Function
    }
}
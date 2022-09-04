# Data fetching

You can use class component and functional components. We will provide you ways to fetch data on both side and client side only.

## Server side fetching

To fetch data on server side, you need to configure your component, just add static function `useServerSideFetching`.

```javascript title='Server fetching function useServerSideFetching(). Return object with custom name and request.'
static useServerSideFetching() {
    return {
        users: axios.get('https://jsonplaceholder.typicode.com/users'),
        posts: axios.get('https://jsonplaceholder.typicode.com/posts'),
    }
}
```

### Example usage on server side

```javascript title='Class component'
import React from 'react';
import axios from 'axios';

class Component extends React.Component {
    constructor(props) {
        super(props);
    }

    static useServerSideFetching() {
        return {
            users: axios.get('https://jsonplaceholder.typicode.com/users'),
            posts: axios.get('https://jsonplaceholder.typicode.com/posts'),
        }
    }

    render() {
        const { users, posts } = this.props.useServerSideProps();

        // result: Leanne Graham
        return <p>{users[0].name}</p>
    }
}
```

> After `useServerSideFetching()` has been called on server, it will pass function `useServerSideProps()` to props, which returns fetched data.

```javascript title='Functional component'
import React from 'react';
import axios from 'axios';

function Component(props) {
    const { users, posts } = props.useServerSideProps();

    // result: Leanne Graham
    return <p>{users[0].name}</p>
}

Component.useServerSideFetching = () => {
    return {
        users: axios.get('https://jsonplaceholder.typicode.com/users'),
        posts: axios.get('https://jsonplaceholder.typicode.com/posts'),
    }
}

```

## Client side fetching

To fetch data on client side, you needn't use any of the following methods, just classical method of React.

### Example usage on client side

```javascript title='Class component'
import React from 'react';

class MyComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            isLoaded: false,
            items: []
        };
    }

    componentDidMount() {
        fetch("https://jsonplaceholder.typicode.com/posts")
        .then(res => res.json())
        .then(
            (result) => {
                this.setState({
                    isLoaded: true,
                    items: result.items
                });
            },
            (error) => {
                this.setState({
                    isLoaded: true,
                    error
                });
            }
        )
    }

    render() {
        const { error, isLoaded, items } = this.state;

        if (error) {
            return <div>Error: {error.message}</div>;
        } else if (!isLoaded) {
            return <div>Loading...</div>;
        } else {
            return (
                <ul>
                    {items.map(item => (
                        <li key={item.id}>
                            {item.name} {item.email}
                        </li>
                    ))}
                </ul>
            );
        }
    }
```

```javascript title='Functional component'
import React, { useEffect, useState } from 'react';

function MyComponent() {
    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [items, setItems] = useState([]);

    useEffect(() => {
        fetch("https://jsonplaceholder.typicode.com/posts")
        .then(res => res.json())
        .then(
            (result) => {
                setIsLoaded(true);
                setItems(result);
            },
            (error) => {
                setIsLoaded(true);
                setError(error);
            }
        )
    }, [])

    if (error) {
        return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
        return <div>Loading...</div>;
    } else {
        return (
            <ul>
                {items.map(item => (
                    <li key={item.id}>
                        {item.name} {item.email}
                    </li>
                ))}
            </ul>
        );
    }
}
```

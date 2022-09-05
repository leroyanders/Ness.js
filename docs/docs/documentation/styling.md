# Styling

Ness.js supports CSS, Sass and Stylus. Simply import your own styles with extensions like this `.css` / `.scss`.

## Module styles

If you want to customize your component with local styles, you can use the following syntax:

```js title='src/components/example.js' showLineNumbers
import styles from './example.css';
import styles from './example.scss';
import styles from './example.less';
```

In the component you need pass the class names as variable:

```javascript
<Component className={styles.className}/>
```

## Global styles

Or, use the following syntax to import global styles from your application:

```js title='src/components/example.js' showLineNumbers
import from './example.css';
import from './example.scss';
import from './example.less';
```

In the component you need pass the class names as variable:

```javascript
<Component className={'className'}/>
```

That's all you need to know about the styles.

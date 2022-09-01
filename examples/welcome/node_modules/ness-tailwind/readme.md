# Awesome UI Components plugin for Ness.js

### 1. Installation
Firstly setup new project, [see how to setup](https://nessapp.vercel.app/getting-started).

Next install via command below:
```
$ npm install ness-tailwind
```

### 2. Configure plugin in ```ness.config.js```


```javascript
module.exports = {
    "plugins": [
        {
            name: 'tailwind',
            config: {
                darkMode: ['class'],
                theme: {
                    screens: {
                        xs: { max: '575px' }, // Mobile (iPhone 3 - iPhone XS Max).
                        sm: { min: '576px', max: '897px' }, // Mobile (matches max: iPhone 11 Pro Max landscape @ 896px).
                        md: { min: '898px', max: '1199px' }, // Tablet (matches max: iPad Pro @ 1112px).
                        lg: { min: '1200px' }, // Desktop smallest.
                        xl: { min: '1159px' }, // Desktop wide.
                        xxl: { min: '1359px' } // Desktop widescreen.
                    }
                },
                content: ["./src/**/*.{html,js}"],
                plugins: [],
            }
        }
    ]
}
```

# 3. Run an applacation
```sh
$ npm run start
```

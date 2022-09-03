---
sidebar_position: 2
---

# Create a new application

Before we will create a new application, you must install the latest [Node.js](https://nodejs.org/en/download/) (v15 is minimal required).

There are three ways to create a new application. First using npx and second using classical package managers.

## 1. Using NPX

```bash
npx init create-ness-app@latest my-new-app
cd my-new-app
npm run start
```

:::tip Recommended usage!
We recommend using the following package manager, because it will automatically use the latest version of `create-ness-app` which can contain bug fixes and other features added.
:::

## 2. Using NPM

Run the following commands:

```bash
npm install -g create-ness-app@latest
```

```bash
create-ness-app my-new-app
cd my-new-app
npm run start
```

## 3. Using Yarn

Run the following commands:

```bash
yarn global add create-ness-app@latest
```

```bash
create-ness-app my-new-app
cd my-new-app
yarn start
```

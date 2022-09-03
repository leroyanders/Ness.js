---
sidebar_position: 2
---

# Commands

We have two clients, the global one for creating a new application with templates and plugins, the second local for managing the root of the application.

## 1. create-ness-app

This CLI creates a new instance of the applications. Requires application name and had some available options.

### Available options

1. --template <template_name>

*Create a template for the application. By default the template will be installed from **ness-default-template**. You can specify the template by passing file path or directly from the NPM registry.*

### Example

```bash
create-ness-app my-new-app --template typescript
```

## 2. nessapp

This client is used by your application's local management.

### Available options

#### 1. **nessapp start**

*Start the application in development mode. The application will generate bundles in deployment folder and then start server on 3000 port by default, if you wanna specify it, see **ness.config.js.***

#### 2. **nessapp build**

*Build the application in production mode. The application will build all assets and pack them in deployment folder.*

#### 3. **nessapp production**

*Run the application in production mode.*

#### 4. **nessapp generate**

*Generate pages, hooks, servcies and others.*

### Example

```bash
nessapp generate page MyNewPage
```

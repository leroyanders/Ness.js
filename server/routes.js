module.exports = (app) => {
    app.use('/', (req, res) => {
        res.render('index', {
          title: 'Welcome to Ness.js',
          component: 'Your component must be declared here'
        });
    });
}
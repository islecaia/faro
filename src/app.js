const path = require('path');
const express = require('express');
const ejs = require('ejs');
const { PORT } = require('./config/env');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: true }));

// Renderiza una vista dentro del shell compartido de layout.ejs (Principio V de la Constitución:
// toda vista reutiliza los mismos tokens/estructura, sin paquete de layout adicional).
app.use((req, res, next) => {
  res.renderPage = async (view, data = {}) => {
    const viewPath = path.join(app.get('views'), `${view}.ejs`);
    const body = await ejs.renderFile(viewPath, data);
    res.render('layout', { ...data, body, path: req.path });
  };
  next();
});

app.use('/', require('./routes/index'));
app.use('/sites', require('./routes/sites'));
app.use('/reports', require('./routes/reports'));
app.use('/sheets', require('./routes/sheets'));
app.use('/email-form', require('./routes/email-form'));
app.use('/sources', require('./routes/sources'));

app.listen(PORT, () => {
  console.log(`Faro escuchando en http://localhost:${PORT}`);
});

module.exports = app;

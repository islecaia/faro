// JS mínimo de cliente: el filtro de sitio del dashboard funciona como un <form method="get">
// normal sin JS; esto solo añade el envío automático al cambiar la selección.
document.addEventListener('DOMContentLoaded', () => {
  const filter = document.getElementById('site-filter');
  const form = document.getElementById('site-filter-form');
  if (filter && form) {
    filter.addEventListener('change', () => form.submit());
  }
});

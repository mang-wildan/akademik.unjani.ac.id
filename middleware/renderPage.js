// res.renderPage(view, locals, layout): renders the view, then the layout with
// the result as `body`. New pages use this; old template pages keep res.render.
module.exports = (req, res, next) => {
  res.renderPage = (view, locals = {}, layout = 'layouts/public') => {
    if (req.query.partial === '1') {
      res.set('Cache-Control', 'no-store');
      return res.render(view, { ...locals, partial: true });
    }
    return res.render(view, locals, (err, body) => {
      if (err) return next(err);
      return res.render(layout, { ...locals, body });
    });
  };
  next();
};

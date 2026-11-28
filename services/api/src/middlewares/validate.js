// Validates req.body / req.query / req.params against zod schemas.
// Parsed (coerced, stripped) values are exposed on `req.valid` — controllers never read raw input.
export default function validate(schemas) {
  return (req, _res, next) => {
    req.valid = {};
    for (const key of ['params', 'query', 'body']) {
      if (schemas[key]) req.valid[key] = schemas[key].parse(req[key] ?? {});
    }
    next();
  };
}

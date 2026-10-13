function notFound(req, res) {
  res.status(404).json({ message: `Không tìm thấy đường dẫn ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.name === "ValidationError" || err.name === "CastError") {
    return res.status(400).json({ message: err.message });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "JSON không hợp lệ" });
  }
  console.error(err);
  res.status(500).json({ message: "Lỗi máy chủ" });
}

module.exports = { notFound, errorHandler };

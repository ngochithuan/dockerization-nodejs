// Executed by the mongo container's healthcheck (mongosh --quiet /scripts/rs-init.js).
// Initialises the single-node replica set on first run (needed for multi-document
// transactions) and only reports healthy once this node is a writable primary.
try {
  rs.status();
} catch (e) {
  if (e.codeName === 'NotYetInitialized') {
    rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'mongo:27017' }] });
  } else {
    throw e;
  }
}
quit(db.hello().isWritablePrimary ? 0 : 1);

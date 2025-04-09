const mongoose = require("mongoose");

const ConnectDB = (uri) => {
  return mongoose
    .connect(uri, { dbName: "videoChatDB" })
    .then((data) => {
      console.log(
        `Connected to db: ${data.connection.name} at ${data.connection.host}`
      );
    })
    .catch((error) => {
      throw error;
    });
};

module.exports = { ConnectDB };

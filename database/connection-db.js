const mongoose = require("mongoose");

const Connection = async () => {
  await mongoose
    .connect(
      `mongodb+srv://sohebs5050:sohebs5050@cluster0.wdmot5y.mongodb.net/blog2?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    )
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.error("Error connecting to MongoDB:", err);
    });
};

module.exports = Connection;

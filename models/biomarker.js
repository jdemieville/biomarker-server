var mongoose = require("mongoose");

var biomarkerSchema = new mongoose.Schema({
    marker: String,
    processes: [{type: String}]
});

module.exports = mongoose.model("Biomarker", biomarkerSchema);
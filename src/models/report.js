const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    machine: { type: mongoose.Schema.Types.ObjectId, ref: "Machine", required: true },
    description: { type: String, required: true, trim: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["ouvert", "en_cours", "résolu"], default: "ouvert", required: true },
    resolutionNote: { type: String, trim: true },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Report", reportSchema);

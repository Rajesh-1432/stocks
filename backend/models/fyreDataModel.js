const { model, Schema } = require("mongoose");

const fyreDataSchema = new Schema(
  {
    "Ticker": { type: String },
    "XCH": { type: Number },
    "LTP": { type: Number },
    "Qty.": { type: Number },
    "Chg": { type: Number },
    "% Chg": { type: Number },
    "Bid Qty": { type: Number },
    "Bid": { type: Number },
    "Ask": { type: Number },
    "Ask Qty": { type: Number },
    "Total Bid": { type: Number },
    "Total Ask": { type: Number },
    "Open": { type: Number },
    "P.Close": { type: Number },
    "Low": { type: Number },
    "High": { type: Number },
    "Avg Price": { type: Number },
    "T.Volume": { type: Number },
    "Total Value": { type: Number },
    "OI": { type: Number },
    "No.of contracts": { type: Number },
    "Strike Price": { type: Number },
    "Exp. Date": { type: String },
    "Option Type": { type: Number },
    "P.Open": { type: Schema.Types.Mixed },
    "OI-Combined Fut": { type: Number },
    "5-Days Avg Vol": { type: Number },
    "Prev OI": { type: Schema.Types.Mixed },
    "inserted_at": { type: Date },
    "data_timestamp": { type: String }
  },
  {
    strict: true,
    versionKey: false,
    collection: "fyers_data" 
  }
);

module.exports = model("fyers_data", fyreDataSchema);

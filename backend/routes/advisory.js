// backend/routes/advisory.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const dayjs = require("dayjs");

const DATA_GOV_BASE = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
const API_KEY = process.env.DATA_GOV_API_KEY || "";

function linearSlope(series) {
  // simple slope of prices vs index using least squares
  const vals = series.map((s,i)=>({x:i,y:s.avgPrice}));
  const n = vals.length;
  if (n<2) return 0;
  const sumX = vals.reduce((a,b)=>a+b.x,0);
  const sumY = vals.reduce((a,b)=>a+b.y,0);
  const sumXY = vals.reduce((a,b)=>a+b.x*b.y,0);
  const sumX2 = vals.reduce((a,b)=>a+b.x*b.x,0);
  const slope = (n*sumXY - sumX*sumY) / (n*sumX2 - sumX*sumX || 1);
  return slope;
}

async function fetchSeries(commodity, market, days=14) {
  const end = dayjs();
  const start = end.subtract(days, "day").format("YYYY-MM-DD");
  const url = `${DATA_GOV_BASE}?api-key=${API_KEY}&format=json&limit=1000&start_date=${start}&end_date=${end.format("YYYY-MM-DD")}&filters=${encodeURIComponent(`commodity:${commodity},market:${market}`)}`;
  const r = await axios.get(url);
  const recs = r.data.records || [];
  const grouped = {};
  recs.forEach(r=> {
    const date = (r.arrival_date||r.transaction_date||"").split("T")[0];
    const p = Number(r.modal_price)||0;
    if (!date) return;
    if (!grouped[date]) grouped[date] = {sum:0,count:0};
    if (p>0){ grouped[date].sum+=p; grouped[date].count+=1;}
  });
  const series = Object.keys(grouped).sort().map(d=>({date:d,avgPrice: grouped[d].count? grouped[d].sum/grouped[d].count:0}));
  return series;
}

router.get("/", async (req,res)=>{
  try{
    const { commodity, market } = req.query;
    if(!commodity || !market) return res.status(400).json({ success:false, message:"commodity and market required" });
    // fetch 14-day series
    const series = await fetchSeries(commodity, market, 14);
    const slope = linearSlope(series);
    const prices = series.map(s=>s.avgPrice).filter(v=>v>0);
    const avg = prices.length? prices.reduce((a,b)=>a+b,0)/prices.length:0;
    const vol = prices.length? Math.sqrt(prices.reduce((a,b)=>a+Math.pow(b-avg,2),0)/prices.length):0;

    // simple rules
    // - if slope strongly positive and volatility low => HOLD (market rising steadily)
    // - if slope negative and volatility low => SELL_NOW
    // - if slope near zero and volatility high => WAIT (uncertain)
    let recommendation = "HOLD";
    if (slope > avg*0.005) recommendation = "HOLD";
    if (slope < -avg*0.005) recommendation = "SELL_NOW";
    if (Math.abs(slope) < avg*0.002 && vol/ (avg||1) > 0.05) recommendation = "WAIT";

    const reason = [];
    reason.push(`14d slope = ${slope.toFixed(3)}`);
    reason.push(`Average price = ₹${Math.round(avg)}, volatility = ${Math.round(vol)}`);

    res.json({ success:true, data: { recommendation, reason, series } });
  } catch(err){
    console.error("advisory error", err.message);
    res.status(500).json({ success:false, message:"advisory failed" });
  }
});

module.exports = router;

// backend/routes/predictSell.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const dayjs = require("dayjs");

const DATA_GOV_BASE = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
const API_KEY = process.env.DATA_GOV_API_KEY || "";

async function fetchSeries(commodity, market, days=30) {
  const end = dayjs();
  const start = end.subtract(days, "day").format("YYYY-MM-DD");
  const url = `${DATA_GOV_BASE}?api-key=${API_KEY}&format=json&limit=2000&start_date=${start}&end_date=${end.format("YYYY-MM-DD")}&filters=${encodeURIComponent(`commodity:${commodity},market:${market}`)}`;
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

function linearRegressionPredict(series, predictDays=7) {
  // series: [{date,avgPrice}]
  const vals = series.map(s=>s.avgPrice);
  if (vals.length < 2) return [];
  const n = vals.length;
  const X = [], Y = [];
  for (let i=0;i<n;i++){ X.push(i); Y.push(vals[i]); }
  const sumX = X.reduce((a,b)=>a+b,0);
  const sumY = Y.reduce((a,b)=>a+b,0);
  const sumXY = X.reduce((a,b,i)=>a + b*Y[i],0);
  const sumX2 = X.reduce((a,b)=>a + b*b,0);
  const denom = n*sumX2 - sumX*sumX || 1;
  const m = (n*sumXY - sumX*sumY)/denom;
  const c = (sumY - m*sumX)/n;
  // predict for next predictDays
  const preds = [];
  for (let d=1; d<=predictDays; d++){
    const x = n-1 + d;
    const y = m*x + c;
    preds.push({ dayOffset: d, predicted: Math.max(0, Math.round(y)) });
  }
  return preds;
}

router.get("/", async (req,res)=>{
  try{
    const { commodity, market } = req.query;
    if(!commodity || !market) return res.status(400).json({ success:false, message:"commodity and market required" });
    const series = await fetchSeries(commodity, market, 30);
    const preds = linearRegressionPredict(series, 7);
    // best day is day with highest predicted price
    const best = preds.length ? preds.reduce((a,b)=> a.predicted > b.predicted ? a : b) : null;
    res.json({ success:true, data:{ history: series, forecast: preds, bestDay: best }});
  } catch(err){
    console.error("predict error", err.message);
    res.status(500).json({ success:false, message:"prediction failed" });
  }
});

module.exports = router;

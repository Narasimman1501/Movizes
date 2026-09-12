import express from "express";
import dotenv from "dotenv";

import {
  searchMoviesWithAI,
  getTrendingMoviesWithAI,
  getMovieAIInsights
} from "./services/geminiService";

dotenv.config();

const app = express();
app.use(express.json());

// 🔍 Search Movies
app.post("/api/search-ai", async (req, res) => {
  const movies = await searchMoviesWithAI(req.body.query);
  res.json(movies);
});

// 🔥 Trending
app.get("/api/trending-ai", async (req, res) => {
  const movies = await getTrendingMoviesWithAI();
  res.json(movies);
});

// 🎬 Insights
app.post("/api/insights", async (req, res) => {
  const insights = await getMovieAIInsights(req.body.movie);
  res.json(insights);
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
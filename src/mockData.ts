import { Movie } from "./types";

export const MOCK_MOVIES: Movie[] = [
  {
    id: "1",
    title: "Dune: Part Two",
    description: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
    releaseDate: "2024-03-01",
    rating: 8.9,
    genres: ["Sci-Fi", "Adventure"],
    coverImage: "https://picsum.photos/seed/dune/400/600",
    bannerImage: "https://picsum.photos/seed/dunebanner/1920/1080",
    cast: ["Timothée Chalamet", "Zendaya"],
    director: "Denis Villeneuve"
  },
  {
    id: "2",
    title: "Oppenheimer",
    description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
    releaseDate: "2023-07-21",
    rating: 8.4,
    genres: ["Drama", "History"],
    coverImage: "https://picsum.photos/seed/oppenheimer/400/600",
    bannerImage: "https://picsum.photos/seed/oppenheimerbanner/1920/1080",
    cast: ["Cillian Murphy", "Emily Blunt"],
    director: "Christopher Nolan"
  },
  {
    id: "3",
    title: "Spider-Man: Across the Spider-Verse",
    description: "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
    releaseDate: "2023-06-02",
    rating: 8.7,
    genres: ["Animation", "Action"],
    coverImage: "https://picsum.photos/seed/spiderman/400/600",
    bannerImage: "https://picsum.photos/seed/spidermanbanner/1920/1080",
    cast: ["Shameik Moore", "Hailee Steinfeld"],
    director: "Joaquim Dos Santos"
  },
  {
    id: "4",
    title: "The Dark Knight",
    description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    releaseDate: "2008-07-18",
    rating: 9.0,
    genres: ["Action", "Crime"],
    coverImage: "https://picsum.photos/seed/darkknight/400/600",
    bannerImage: "https://picsum.photos/seed/darkknightbanner/1920/1080",
    cast: ["Christian Bale", "Heath Ledger"],
    director: "Christopher Nolan"
  },
  {
    id: "5",
    title: "Inception",
    description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    releaseDate: "2010-07-16",
    rating: 8.8,
    genres: ["Action", "Sci-Fi"],
    coverImage: "https://picsum.photos/seed/inception/400/600",
    bannerImage: "https://picsum.photos/seed/inceptionbanner/1920/1080",
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt"],
    director: "Christopher Nolan"
  },
  {
    id: "6",
    title: "Poor Things",
    description: "The incredible tale and fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.",
    releaseDate: "2023-12-08",
    rating: 8.0,
    genres: ["Comedy", "Drama"],
    coverImage: "https://picsum.photos/seed/poorthings/400/600",
    bannerImage: "https://picsum.photos/seed/poorthingsbanner/1920/1080",
    cast: ["Emma Stone", "Mark Ruffalo"],
    director: "Yorgos Lanthimos"
  }
];

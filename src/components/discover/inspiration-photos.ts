import beachSmall from "@/assets/discover/beach-600.webp.asset.json";
import beach from "@/assets/discover/beach-1200.webp.asset.json";
import marketSmall from "@/assets/discover/market-600.webp.asset.json";
import market from "@/assets/discover/market-1200.webp.asset.json";
import mountainSmall from "@/assets/discover/mountain-600.webp.asset.json";
import mountain from "@/assets/discover/mountain-1200.webp.asset.json";
import dinnerSmall from "@/assets/discover/dinner-600.webp.asset.json";
import dinner from "@/assets/discover/dinner-1200.webp.asset.json";

// Editorial inspiration only; never a Google place record or an endorsement.
export const INSPIRATION_PHOTOS = [
  { n: 1, image: beach, small: beachSmall, photographer: "Rafael Minguet Delgado", source: "https://www.pexels.com/photo/breathtaking-sunrise-over-the-beach-in-valencia-28793797/" },
  { n: 2, image: market, small: marketSmall, photographer: "Daniela Perilla", source: "https://www.pexels.com/photo/woman-selling-vegetables-on-a-food-market-13833980/" },
  { n: 3, image: mountain, small: mountainSmall, photographer: "Saul Bandera Brotheridge", source: "https://www.pexels.com/photo/stunning-mountain-sunset-landscape-view-30626831/" },
  { n: 4, image: dinner, small: dinnerSmall, photographer: "Askar Abayev", source: "https://www.pexels.com/photo/a-group-of-people-having-dinner-at-the-backyard-5638815/" },
] as const;
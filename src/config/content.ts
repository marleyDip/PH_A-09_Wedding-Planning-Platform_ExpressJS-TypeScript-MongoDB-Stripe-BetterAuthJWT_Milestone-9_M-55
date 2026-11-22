/**
 *
 * Static site content. Categories are fixed by the assignment, and testimonials are SAMPLE placeholders
 *
 * (flagged `sample: true` so the UI labels them) until you replace them with real reviews.
 *
 * They live in code on purpose: the assignment asks for only three business collections
 *
 * (services, bookings, transactions), so no extra collections are created for them.
 *
 */

export interface CategoryContent {
  id: string;
  name: string;
  tagline: string;
  description: string;
  tags: string[];
}

export interface TestimonialContent {
  id: string;
  name: string;
  location: string;
  service: string;
  rating: number;
  quote: string;
  image?: string | null;
  status: string;
  sample: boolean;
}

export const CATEGORIES: CategoryContent[] = [
  {
    id: "photography-videography",
    name: "Photography & Videography",
    tagline: "Capture every moment",
    description:
      "Timeless portraits and cinematic films that turn your big day into a story worth reliving.",
    tags: ["Pre-wedding shoot", "Cinematic film", "Drone coverage", "Albums"],
  },
  {
    id: "wedding-venues",
    name: "Wedding Venues",
    tagline: "Halls, gardens & resorts",
    description:
      "From grand banquet halls to beachfront resorts, find the perfect setting for your guest list.",
    tags: ["Banquet halls", "Garden venues", "Resorts", "Beachfront"],
  },
  {
    id: "decoration-florist",
    name: "Decoration & Florist",
    tagline: "Stages, flowers & lighting",
    description:
      "Dreamy stages, floral arches and glowing ambience designed around your vision.",
    tags: ["Stage design", "Floral arches", "Mood lighting", "Gaye Holud"],
  },
  {
    id: "catering-services",
    name: "Catering Services",
    tagline: "Menus guests will remember",
    description:
      "Traditional feasts, live counters and dessert bars for every taste and headcount.",
    tags: ["Traditional menus", "Live counters", "Desserts", "Buffet"],
  },
  {
    id: "makeup-styling",
    name: "Makeup & Styling",
    tagline: "Bridal & groom looks",
    description:
      "Radiant bridal makeup, hair styling and polished grooming for the whole wedding party.",
    tags: ["Bridal makeup", "Hair styling", "Groom grooming", "Henna"],
  },
  {
    id: "wedding-fashion",
    name: "Wedding Fashion",
    tagline: "Outfits & accessories",
    description:
      "Sarees, lehengas, sherwanis and finishing touches from trusted designers and boutiques.",
    tags: ["Bridal wear", "Sherwani", "Jewellery", "Accessories"],
  },
];

export const TESTIMONIALS: TestimonialContent[] = [
  {
    id: "t-1",
    name: "Ayesha & Rahim",
    location: "Dhaka",
    service: "Wedding Photography",
    rating: 5,
    quote:
      "Everything was in one place, so comparing vendors was easy. Sending a booking request only took a few minutes.",
    image: "https://i.pravatar.cc/160?img=44",
    status: "approved",
    sample: true,
  },
  {
    id: "t-2",
    name: "Tasnia & Farhan",
    location: "Chattogram",
    service: "Wedding Venues",
    rating: 5,
    quote:
      "We could filter by city, check prices upfront and see exactly who the vendor was before booking.",
    image: "https://i.pravatar.cc/160?img=5",
    status: "approved",
    sample: true,
  },
  {
    id: "t-3",
    name: "Mitu & Sabbir",
    location: "Sylhet",
    service: "Decoration & Florist",
    rating: 4,
    quote:
      "The dashboard made it simple to follow our requests from pending to confirmed without chasing anyone.",
    image: "https://i.pravatar.cc/160?img=26",
    status: "approved",
    sample: true,
  },
  {
    id: "t-4",
    name: "Nabila & Arif",
    location: "Dhaka",
    service: "Makeup & Styling",
    rating: 5,
    quote:
      "Finding bridal makeup and styling in the same app as our venue and decor saved us so much time.",
    image: "https://i.pravatar.cc/160?img=23",
    status: "approved",
    sample: true,
  },
  {
    id: "t-5",
    name: "Shirin & Kamal",
    location: "Rajshahi",
    service: "Catering Services",
    rating: 5,
    quote:
      "Clear descriptions and honest pricing helped us choose a caterer with confidence.",
    image: "https://i.pravatar.cc/160?img=52",
    status: "approved",
    sample: true,
  },
];

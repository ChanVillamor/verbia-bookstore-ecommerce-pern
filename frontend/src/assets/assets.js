// icons
import user_icon from './user-icon.png';
import bin_icon from './bin-icon.png';
import cart_icon from './cart-icon.png';
import menu_icon from './menu-icon.png';
import dropdown_icon from './dropdown-icon.png';
import search_icon from './search-icon.png';
import cross_icon from './cross-icon.png';
import plus_icon from './plus-icon.png';
import save_icon from './save-icon.png';
import book_logo from './book-logo.png'

// Placeholder logo for now
import logo from './logo.png'; // Assuming you have a logo.png in the assets folder

export const assets = {
  user_icon,
  bin_icon,
  cart_icon,
  menu_icon,
  dropdown_icon,
  search_icon,
  cross_icon,
  plus_icon,
  save_icon,
  book_logo // Export the logo
};

// book-images
import book_img1 from './book_img1.jpg';
import book_img2 from './book_img2.jpg';
import book_img3 from './book_img3.jpg';

export const Books = [
  {
    book_id: "book001",
    title: "Call Me by Your Name",
    author: "André Aciman",
    genre: ["Romance", "LGBTQ+"],
    publisher: "Farrar, Straus and Giroux",
    price: 1000,
    stock: 25,
    description:
      "Set in the summer of 1983 in Italy, this powerful coming-of-age novel explores the intense romantic relationship between Elio, a precocious 17-year-old, and Oliver, a 24-year-old scholar. A tender, deeply emotional exploration of first love and identity.",
    image: [book_img1],
    publication_year: 2007,
    language: "English",
    pages: 248,
    rating: 4.6,
    isOnSale: true,
    sale_price: 599,
  },
  {
    book_id: "book002",
    title: "The Song of Achilles",
    author: "Madeline Miller",
    genre: ["Mythology", "Historical Fiction", "LGBTQ+"],
    publisher: "Ecco",
    price: 600,
    stock: 30,
    description:
      "A retelling of the Iliad from the perspective of Patroclus, this novel explores his relationship with Achilles, bringing to life a powerful love story amid war, fate, and honor.",
    image: [book_img2],
    publication_year: 2011,
    language: "English",
    pages: 416,
    rating: 4.7,
    isOnSale: true,
    salesale_price: 299,
  },
  {
    book_id: "book003",
    title: "Aristotle and Dante Discover the Secrets of the Universe",
    author: "Benjamin Alire Sáenz",
    genre: ["Young Adult", "LGBTQ+"],
    publisher: "Simon & Schuster Books for Young Readers",
    price: 500,
    stock: 20,
    description:
      "This coming-of-age novel tells the story of two Mexican-American boys, Aristotle and Dante, as they form an unlikely friendship that blossoms into a deeper understanding of love, identity, and family.",
    image: [book_img3],
    publication_year: 2012,
    language: "English",
    pages: 359,
    rating: 4.8,
    isOnSale: false,
    salesale_price: false,
  },
];


export const heroContent = 
  {
    genre: "LGBTQ+",
    title: "Celebrate Pride Month 🌈",
    subtitle: "with Stories That Matter",
    description:
      "Discover a vibrant collection of LGBTQ+ books—from heartwarming romances to powerful memoirs. Let every page inspire love, identity, and pride.",
    buttonLabel: "Explore Pride Collection",
    buttonLink: "/book-collection",
  };
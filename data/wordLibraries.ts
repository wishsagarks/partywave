export interface WordPair {
  id: number;
  civilian: string;
  undercover: string;
  category: string;
}

export interface WordLibrary {
  name: string;
  pairs: WordPair[];
  isActive: boolean;
  isOfficial: boolean;
}

export const OFFICIAL_WORD_LIBRARIES: WordLibrary[] = [
  {
    name: "Animals",
    isActive: true,
    isOfficial: true,
    pairs: [
      { id: 1, civilian: "Cat", undercover: "Dog", category: "Pets" },
      { id: 2, civilian: "Lion", undercover: "Tiger", category: "Wild" },
      { id: 3, civilian: "Snake", undercover: "Lizard", category: "Reptiles" },
      { id: 4, civilian: "Eagle", undercover: "Hawk", category: "Birds" },
      { id: 5, civilian: "Whale", undercover: "Dolphin", category: "Marine" },
      { id: 6, civilian: "Horse", undercover: "Zebra", category: "Mammals" },
      { id: 7, civilian: "Butterfly", undercover: "Moth", category: "Insects" },
      { id: 8, civilian: "Rabbit", undercover: "Hamster", category: "Small" },
    ]
  },
  {
    name: "Food & Drinks",
    isActive: true,
    isOfficial: true,
    pairs: [
      { id: 9, civilian: "Coffee", undercover: "Tea", category: "Hot Drinks" },
      { id: 10, civilian: "Pizza", undercover: "Burger", category: "Fast Food" },
      { id: 11, civilian: "Apple", undercover: "Orange", category: "Fruits" },
      { id: 12, civilian: "Chocolate", undercover: "Vanilla", category: "Flavors" },
      { id: 13, civilian: "Sandwich", undercover: "Wrap", category: "Lunch" },
      { id: 14, civilian: "Pasta", undercover: "Noodles", category: "Carbs" },
      { id: 15, civilian: "Wine", undercover: "Beer", category: "Alcohol" },
      { id: 16, civilian: "Cake", undercover: "Pie", category: "Desserts" },
    ]
  },
  {
    name: "Entertainment",
    isActive: true,
    isOfficial: true,
    pairs: [
      { id: 17, civilian: "Movie", undercover: "TV Show", category: "Media" },
      { id: 18, civilian: "Guitar", undercover: "Piano", category: "Music" },
      { id: 19, civilian: "Football", undercover: "Basketball", category: "Sports" },
      { id: 20, civilian: "Book", undercover: "Magazine", category: "Reading" },
      { id: 21, civilian: "Theatre", undercover: "Cinema", category: "Venues" },
      { id: 22, civilian: "Concert", undercover: "Festival", category: "Events" },
      { id: 23, civilian: "Video Game", undercover: "Board Game", category: "Games" },
      { id: 24, civilian: "Podcast", undercover: "Radio", category: "Audio" },
    ]
  },
  {
    name: "Professions",
    isActive: false,
    isOfficial: true,
    pairs: [
      { id: 25, civilian: "Doctor", undercover: "Nurse", category: "Medical" },
      { id: 26, civilian: "Teacher", undercover: "Professor", category: "Education" },
      { id: 27, civilian: "Chef", undercover: "Baker", category: "Culinary" },
      { id: 28, civilian: "Pilot", undercover: "Captain", category: "Transport" },
      { id: 29, civilian: "Artist", undercover: "Designer", category: "Creative" },
      { id: 30, civilian: "Engineer", undercover: "Architect", category: "Technical" },
      { id: 31, civilian: "Lawyer", undercover: "Judge", category: "Legal" },
      { id: 32, civilian: "Farmer", undercover: "Gardener", category: "Agriculture" },
    ]
  },
  {
    name: "Objects & Tools",
    isActive: false,
    isOfficial: true,
    pairs: [
      { id: 33, civilian: "Pencil", undercover: "Pen", category: "Writing" },
      { id: 34, civilian: "Hammer", undercover: "Screwdriver", category: "Tools" },
      { id: 35, civilian: "Phone", undercover: "Tablet", category: "Electronics" },
      { id: 36, civilian: "Chair", undercover: "Stool", category: "Furniture" },
      { id: 37, civilian: "Umbrella", undercover: "Raincoat", category: "Weather" },
      { id: 38, civilian: "Watch", undercover: "Clock", category: "Time" },
      { id: 39, civilian: "Backpack", undercover: "Suitcase", category: "Bags" },
      { id: 40, civilian: "Glasses", undercover: "Sunglasses", category: "Eyewear" },
    ]
  },
  {
    name: "Places & Travel",
    isActive: false,
    isOfficial: true,
    pairs: [
      { id: 41, civilian: "Beach", undercover: "Lake", category: "Water" },
      { id: 42, civilian: "Mountain", undercover: "Hill", category: "Elevation" },
      { id: 43, civilian: "City", undercover: "Town", category: "Urban" },
      { id: 44, civilian: "Hotel", undercover: "Motel", category: "Lodging" },
      { id: 45, civilian: "Airport", undercover: "Train Station", category: "Transport" },
      { id: 46, civilian: "Restaurant", undercover: "Cafe", category: "Dining" },
      { id: 47, civilian: "Park", undercover: "Garden", category: "Green Space" },
      { id: 48, civilian: "Museum", undercover: "Gallery", category: "Culture" },
    ]
  }
];

export const getActiveWordPairs = (libraries: WordLibrary[]): WordPair[] => {
  return libraries
    .filter(lib => lib.isActive)
    .flatMap(lib => lib.pairs);
};

export const getRandomWordPair = (libraries: WordLibrary[]): WordPair | null => {
  const activePairs = getActiveWordPairs(libraries);
  if (activePairs.length === 0) return null;
  
  return activePairs[Math.floor(Math.random() * activePairs.length)];
};
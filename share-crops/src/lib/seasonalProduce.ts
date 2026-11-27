/**
 * Seasonal produce data sourced from The Old Farmer's Almanac 2026 Online Edition.
 * Maps month numbers (1–12) to produce keywords in season for North America.
 */
const SEASONAL_BY_MONTH: Record<number, string[]> = {
  1:  ['orange', 'lemon', 'grapefruit', 'citrus', 'kale', 'beet', 'leek',
       'sweet potato', 'winter squash', 'cabbage', 'turnip', 'brussels sprout',
       'root vegetable', 'collard', 'pomegranate'],
  2:  ['orange', 'lemon', 'grapefruit', 'citrus', 'kale', 'beet', 'leek',
       'sweet potato', 'winter squash', 'cabbage', 'turnip', 'brussels sprout',
       'root vegetable', 'collard', 'pomegranate'],
  3:  ['strawberr', 'mango', 'kiwi', 'citrus', 'orange', 'lemon',
       'spinach', 'swiss chard', 'collard', 'broccoli', 'radish',
       'mushroom', 'asparagus', 'lettuce', 'green bean', 'pea'],
  4:  ['strawberr', 'apricot', 'kiwi',
       'pea', 'asparagus', 'rhubarb', 'spinach', 'lettuce',
       'broccoli', 'radish', 'mushroom'],
  5:  ['strawberr', 'apricot', 'cherr',
       'pea', 'asparagus', 'rhubarb', 'zucchini', 'okra',
       'green bean', 'lettuce', 'spinach'],
  6:  ['cherr', 'blueberr', 'blackberr', 'raspberr', 'peach', 'plum',
       'cantaloupe', 'watermelon', 'avocado', 'strawberr', 'melon',
       'bell pepper', 'pepper', 'cucumber', 'corn', 'tomato',
       'summer squash', 'zucchini', 'green bean', 'lettuce'],
  7:  ['blueberr', 'blackberr', 'raspberr', 'peach', 'plum', 'melon',
       'watermelon', 'cherr',
       'bell pepper', 'pepper', 'cucumber', 'corn', 'tomato',
       'summer squash', 'eggplant', 'green bean', 'zucchini', 'okra'],
  8:  ['blueberr', 'blackberr', 'raspberr', 'peach', 'plum', 'melon',
       'bell pepper', 'pepper', 'cucumber', 'corn', 'tomato',
       'summer squash', 'eggplant', 'green bean', 'zucchini', 'cabbage'],
  9:  ['cranberr', 'grape', 'pomegranate', 'pear', 'apple', 'plum',
       'winter squash', 'kale', 'mushroom', 'cauliflower', 'broccoli',
       'turnip', 'brussels sprout', 'eggplant', 'tomato', 'pepper',
       'summer squash', 'corn'],
  10: ['apple', 'pear', 'grape', 'pomegranate', 'cranberr',
       'winter squash', 'pumpkin', 'brussels sprout', 'cauliflower',
       'kale', 'sweet potato', 'yam', 'potato', 'turnip', 'root vegetable',
       'mushroom', 'carrot'],
  11: ['apple', 'pear', 'pomegranate', 'grape', 'cranberr',
       'winter squash', 'brussels sprout', 'cauliflower', 'kale',
       'sweet potato', 'yam', 'potato', 'root vegetable', 'turnip', 'carrot'],
  12: ['pear', 'pomegranate', 'citrus', 'orange', 'lemon', 'grapefruit',
       'winter squash', 'kale', 'brussels sprout', 'potato', 'turnip',
       'leek', 'root vegetable', 'collard'],
};

/**
 * Returns true if the listing title or description contains produce
 * that is currently in season according to the 2026 Old Farmer's Almanac.
 */
export function isProduceInSeason(title: string, description = ''): boolean {
  const month = new Date().getMonth() + 1; // 1–12
  const seasonal = SEASONAL_BY_MONTH[month] ?? [];
  const haystack = `${title} ${description}`.toLowerCase();
  return seasonal.some((keyword) => haystack.includes(keyword));
}

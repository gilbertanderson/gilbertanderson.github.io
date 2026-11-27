/*
  Diet profiles, in the order they appear in the dropdown. Each diet is plain
  data, so adding a new source means adding an entry here (or uploading a file
  in the app). The checker in diet-check.js reads these rules.

  Every rule records where it came from:
    sources  : [{ id, page? }] pointing at SOURCES below
    bookList : the source's own avoid/limit list, word for word, shown in the app

  Rule types:
    "ingredients" : matches words in the ingredient list, plus Open Food Facts
                    allergen, additive, category and analysis tags
    "nutrient"    : compares a nutrient (per 100 g) against limits

  Levels: "avoid" (does not fit the diet) or "caution" (limit / check label).
*/

const SOURCES = {
  bbd: {
    title: "Best Bet Diet Cookbook, MS Hope",
    url: "https://mshope.com/best-bet-diet-cookbook",
    note: "The diet's rules: what to eliminate, reduce and increase, and the avoid lists in the Meal Strategies section."
  },
  veganSociety: {
    title: "Definition of veganism, The Vegan Society",
    url: "https://www.vegansociety.com/go-vegan/definition-veganism",
    note: "Defines vegan eating as leaving out all products derived wholly or partly from animals, including meat, fish, shellfish, insects, dairy, eggs and honey."
  },
  cdc: {
    title: "Diabetes Meal Planning, CDC",
    url: "https://cdc.gov/diabetes/healthy-eating/diabetes-meal-planning.html",
    note: "Fewer added sugars and refined grains, whole fruit over juice, water or low-calorie drinks, and carb targets set with a doctor or dietitian."
  },
  mayo: {
    title: "Diabetes diet: Create your healthy-eating plan, Mayo Clinic",
    url: "https://www.mayoclinic.org/diabetes-diet/art-20044295",
    note: "Avoid trans fats, limit saturated fat, and keep sodium to 2,300 mg a day or less."
  },
  nhs: {
    title: "How to read food labels, NHS",
    url: "https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/how-to-read-food-labels/",
    note: "The high and low cutoffs per 100 g used when a source says to limit sugar, salt or saturated fat but gives no number for a single product. High: sugars over 22.5 g, saturated fat over 5 g, sodium over 0.6 g. Low: sugars 5 g or less, salt 0.3 g or less."
  },
  usda: {
    title: "FoodData Central, USDA",
    url: "https://fdc.nal.usda.gov",
    note: "Fills in products or ingredient lists that Open Food Facts is missing, from USDA's Branded Foods data. Public domain (CC0)."
  },
  off: {
    title: "Open Food Facts",
    url: "https://world.openfoodfacts.org",
    note: "Product names, ingredients, allergens, nutrition facts and vegan status, contributed by volunteers. Data can be incomplete."
  }
};

// Shared word lists
const DAIRY_TERMS = ["milk", "milk powder", "milk solids", "milk protein", "skim milk", "skim milk powder",
  "buttermilk", "cheese", "cottage cheese", "butter", "butterfat", "cream", "sour cream", "yogurt",
  "yoghurt", "ice cream", "whey", "casein", "caseinate", "sodium caseinate", "lactose", "lactalbumin",
  "lactoglobulin", "bovine albumin", "gamma globulin", "ghee", "curd", "kefir", "lactaid"];
const DAIRY_EXCEPTIONS = ["coconut milk", "almond milk", "rice milk", "cashew milk", "hemp milk",
  "oat milk", "soy milk", "coconut cream", "cream of tartar", "cocoa butter", "cacao butter",
  "shea butter", "peanut butter", "almond butter", "cashew butter", "sunflower butter",
  "seed butter", "nut butter", "apple butter", "milk thistle", "dairy-free", "dairy free"];
const ARTIFICIAL_SWEETENER_ADDITIVES = ["en:e950", "en:e951", "en:e952", "en:e954", "en:e955", "en:e961", "en:e962"];
const ARTIFICIAL_SWEETENER_TERMS = ["aspartame", "sucralose", "acesulfame", "acesulfame potassium",
  "acesulfame k", "saccharin", "neotame", "advantame", "cyclamate"];

const DIETS = [
  /* ---------- 1. Best Bet Diet ---------- */
  {
    id: "best-bet",
    name: "Best Bet Diet",
    sources: ["bbd", "nhs"],
    summary:
      "Eliminates dairy, gluten, legumes, high-sugar foods and artificial sweeteners. " +
      "Reduces saturated fat, salt (under 1,000 mg sodium a day), corn, eggs, yeast and alcohol. " +
      "The book also says to avoid any food that causes you an allergic reaction, which the app can't know.",
    dailySodiumCapMg: 1000,
    rules: [
      {
        type: "ingredients", level: "avoid", label: "Dairy",
        note: "Cow's milk and all dairy products, including lactose-free products and goat and sheep milk, are excluded.",
        sources: [{ id: "bbd", page: "38" }],
        bookList: ["Milk and all derivatives of milk", "Lactaid", "Cheese", "Butter", "Cottage cheese",
                   "Yogurt", "Ice cream", "Milk proteins: casein; lactalbumin, lactoglobulin, bovine albumin and gamma globulin; whey, caseinates, skim milk powder and milk solids",
                   "Goat's milk and sheep's milk and any cheeses made from them",
                   "Soy milk (not allowed as a substitute, because soy is a legume)"],
        allergens: ["en:milk"], terms: DAIRY_TERMS, exceptions: DAIRY_EXCEPTIONS
      },
      {
        type: "ingredients", level: "avoid", label: "Gluten",
        note: "The complete avoidance of gluten at all times is essential.",
        sources: [{ id: "bbd", page: "39" }],
        bookList: ["Wheat", "Rye", "Barley", "Oats", "White and whole-wheat flours", "Durham (durum) flour",
                   "Triticale", "Bulgar (bulgur)", "Spelt", "Kamut",
                   "Soy flour (made from soybeans, a legume)",
                   "Cereal (even gluten-free cereals are filled with sugar)"],
        allergens: ["en:gluten"],
        terms: ["wheat", "whole wheat", "whole-wheat", "rye", "barley", "oat", "oatmeal", "oat flour",
                "spelt", "kamut", "triticale", "bulgur", "bulgar", "durum", "durham", "semolina",
                "farro", "einkorn", "emmer", "malt", "malted", "malt extract", "seitan", "couscous",
                "soy flour"],
        exceptions: ["buckwheat", "gluten-free oats", "gluten free oats"]
      },
      {
        type: "ingredients", level: "avoid", label: "Cereal",
        note: "Even gluten-free cereals are filled with sugar, so nuts, seeds and fruit are a better breakfast.",
        sources: [{ id: "bbd", page: "39" }],
        categories: ["en:breakfast-cereals"]
      },
      {
        type: "ingredients", level: "avoid", label: "Legumes",
        note: "Legumes contain lectins that make the gut wall leakier, and proteins that resemble ones in the nervous system.",
        sources: [{ id: "bbd", page: "40" }],
        bookList: ["All beans (adzuki, black, broad, fava, field, garbanzo, horse, kidney, lima, mung, navy, pinto, red, yellow and green string beans, white beans)",
                   "Black-eyed peas", "Carob", "Chickpeas", "Lentils", "Peas", "Miso",
                   "Peanuts and peanut butter", "Snow peas", "Sugar snap peas",
                   "Soybeans and all soybean products, including tofu"],
        allergens: ["en:soybeans", "en:peanuts", "en:lupin"],
        terms: ["soy", "soya", "soybean", "soy lecithin", "soy protein", "soy flour", "tofu", "tempeh",
                "edamame", "miso", "bean", "adzuki", "azuki", "fava", "mung", "chickpea", "garbanzo",
                "lentil", "pea", "pea protein", "pea flour", "peanut", "carob", "locust bean gum",
                "lupin", "black-eyed pea", "snow pea", "sugar snap pea"],
        exceptions: ["vanilla bean", "coffee bean", "cocoa bean", "cacao bean", "jelly bean"]
      },
      {
        type: "ingredients", level: "avoid", label: "Artificial sweeteners",
        note: "Artificial sweeteners are very detrimental for the microbiome, leading to a leaky gut and inflammation.",
        sources: [{ id: "bbd", page: "41" }, { id: "bbd", page: "15" }],
        bookList: ["Aspartame and other artificial sweeteners"],
        additives: ARTIFICIAL_SWEETENER_ADDITIVES, terms: ARTIFICIAL_SWEETENER_TERMS
      },
      {
        type: "ingredients", level: "avoid", label: "Candy and soft drinks",
        note: "Candy, soft drinks and high-sugar foods alter the gut flora.",
        sources: [{ id: "bbd", page: "15" }],
        bookList: ["Candy, soft drinks and foods with a high sugar content"],
        categories: ["en:sodas", "en:carbonated-drinks", "en:candies", "en:confectioneries"]
      },
      {
        type: "ingredients", level: "avoid", label: "Malt drinks, beer and whisky",
        note: "Malt-containing beverages are excluded, and whisky and beer contain gluten.",
        sources: [{ id: "bbd", page: "42" }, { id: "bbd", page: "15" }],
        bookList: ["Malt-containing beverages: Postum, Ovaltine, beers and ales", "Whisky and beer (they have gluten in them)"],
        categories: ["en:beers", "en:whiskies", "en:malt-beverages"],
        terms: ["postum", "ovaltine", "beer", "ale", "whisky", "whiskey"],
        exceptions: ["ginger ale", "root beer"]
      },
      {
        type: "ingredients", level: "avoid", label: "Butter, lard and trans fats",
        note: "Butter and lard are pure saturated fat, and trans fats are highly inflammatory.",
        sources: [{ id: "bbd", page: "42" }],
        bookList: ["Butter and lard", "Any product with trans fats",
                   "Margarine that contains milk products"],
        terms: ["lard", "partially hydrogenated", "hydrogenated", "shortening"]
      },
      {
        type: "nutrient", level: "avoid", label: "Trans fat",
        note: "Any product with trans fats must be avoided.",
        sources: [{ id: "bbd", page: "42" }],
        nutrient: "trans-fat_100g", unit: "g", max: 0
      },
      {
        type: "nutrient", label: "Sugar",
        note: "Greatly reduce all sugar intake. Over 22.5 g per 100 g is high and does not fit; over 5 g is a caution.",
        sources: [{ id: "bbd", page: "41" }, { id: "nhs" }],
        nutrient: "sugars_100g", unit: "g", cautionAbove: 5, avoidAbove: 22.5
      },
      {
        type: "nutrient", label: "Sodium",
        note: "Keep sodium under 1,000 mg a day and avoid products with excessive sodium. Over 600 mg per 100 g is high and does not fit; over 120 mg is a caution.",
        sources: [{ id: "bbd", page: "41" }, { id: "bbd", page: "22" }, { id: "nhs" }],
        nutrient: "sodium_100g", unit: "mg", scale: 1000, cautionAbove: 120, avoidAbove: 600
      },
      {
        type: "nutrient", level: "caution", label: "Saturated fat",
        note: "Keep saturated fat intake low, and eat lean red meat only a couple of times a week. Over 5 g per 100 g is high. Plain nuts and seeds aren't flagged, since the book recommends eating more of them for their good fats.",
        sources: [{ id: "bbd", page: "42" }, { id: "bbd", page: "15" }, { id: "bbd", page: "22" }, { id: "bbd", page: "56" }, { id: "nhs" }],
        nutrient: "saturated-fat_100g", unit: "g", cautionAbove: 5,
        // Pages 22 and 56: eat more nuts ("high in good fats"); nuts and seeds listed as snacks
        exemptIfOnly: {
          terms: ["almond", "walnut", "pecan", "cashew", "pistachio", "hazelnut", "macadamia", "macadamia nut", "pine nut",
                  "chestnut", "brazil nut", "pumpkin seed", "pepita", "sunflower seed", "flax seed", "flaxseed", "chia seed",
                  "hemp seed", "mixed nuts", "nuts", "seeds"],
          allow: ["salt", "sea salt", "roasted", "dry roasted", "raw", "unsalted", "halves", "pieces", "chopped", "sliced", "whole", "ingredients"]
        }
      },
      {
        type: "ingredients", level: "caution", label: "Corn",
        note: "Limit corn and other non-gluten grains. Corn hides in many products, so read labels.",
        sources: [{ id: "bbd", page: "40" }, { id: "bbd", page: "15" }],
        bookList: ["Corn flour, cornmeal and cornstarch (use arrowroot, potato flour or rice flour instead)",
                   "Products that often contain corn: margarine, baking mixes, baking powder, candy, marshmallows, bourbon and some whiskies"],
        terms: ["corn", "maize", "cornstarch", "corn starch", "cornmeal", "cornflour", "corn flour",
                "corn syrup", "high fructose corn syrup", "polenta", "baking powder", "marshmallow", "bourbon"]
      },
      {
        type: "ingredients", level: "caution", label: "Eggs",
        note: "Use eggs only in moderation, no more than two a week, and restrict them if you're sensitive.",
        sources: [{ id: "bbd", page: "41" }],
        bookList: ["Eggs, egg yolk, egg white, egg albumen or albumen"],
        allergens: ["en:eggs"], terms: ["egg", "egg white", "egg yolk", "egg albumen", "albumen"],
        exceptions: ["eggplant"]
      },
      {
        type: "ingredients", level: "caution", label: "Yeast",
        note: "Yeast is highly allergenic and needs to be limited if you're allergic to it.",
        sources: [{ id: "bbd", page: "41" }],
        terms: ["yeast", "yeast extract"]
      },
      {
        type: "ingredients", level: "caution", label: "Margarine and salad oils",
        note: "Reduce omega 6 fats found in margarine, salad oils and many baked goods. Extra virgin olive oil is preferred; flax seed, walnut, canola, mustard seed and avocado oils are also fine if not overheated.",
        sources: [{ id: "bbd", page: "15" }, { id: "bbd", page: "42" }],
        terms: ["margarine", "sunflower oil", "safflower oil", "cottonseed oil",
                "grapeseed oil", "vegetable oil"]
      },
      {
        type: "ingredients", level: "caution", label: "Alcohol",
        note: "At best, drink wine and spirits in moderation.",
        sources: [{ id: "bbd", page: "15" }],
        categories: ["en:alcoholic-beverages", "en:wines", "en:spirits"]
      }
    ]
  },

  /* ---------- 2. Vegan ---------- */
  {
    id: "vegan",
    name: "Vegan",
    sources: ["veganSociety", "off"],
    summary: "No meat, poultry, fish, shellfish, dairy, eggs, honey or other animal-derived ingredients.",
    rules: [
      {
        type: "ingredients", level: "avoid", label: "Not vegan (Open Food Facts)",
        note: "Open Food Facts marks at least one ingredient as animal-derived.",
        sources: [{ id: "off" }],
        analysis: ["en:non-vegan"]
      },
      {
        type: "ingredients", level: "avoid", label: "Meat and poultry",
        sources: [{ id: "veganSociety" }],
        terms: ["meat", "beef", "pork", "chicken", "turkey", "lamb", "mutton", "veal", "duck",
                "venison", "bacon", "ham", "sausage", "pepperoni", "salami", "chorizo",
                "prosciutto", "bone broth", "beef broth", "chicken broth", "beef stock",
                "chicken stock", "meat extract", "chicken fat", "beef fat"],
        exceptions: ["meatless", "plant-based meat", "plant based meat", "chicken-free",
                     "beef-free", "veggie sausage", "vegan sausage"]
      },
      {
        type: "ingredients", level: "avoid", label: "Fish and shellfish",
        sources: [{ id: "veganSociety" }],
        allergens: ["en:fish", "en:crustaceans", "en:molluscs"],
        terms: ["fish", "anchovy", "anchovies", "tuna", "salmon", "cod", "sardine", "fish oil",
                "fish sauce", "shrimp", "prawn", "crab", "lobster", "oyster", "clam", "mussel",
                "scallop", "squid", "octopus"],
        exceptions: ["fish-free", "vegan fish"]
      },
      {
        type: "ingredients", level: "avoid", label: "Dairy",
        sources: [{ id: "veganSociety" }],
        allergens: ["en:milk"], terms: DAIRY_TERMS, exceptions: DAIRY_EXCEPTIONS
      },
      {
        type: "ingredients", level: "avoid", label: "Eggs",
        sources: [{ id: "veganSociety" }],
        allergens: ["en:eggs"], terms: ["egg", "egg white", "egg yolk", "albumen", "egg powder"],
        exceptions: ["eggplant", "egg-free", "egg free"]
      },
      {
        type: "ingredients", level: "avoid", label: "Honey and other animal products",
        note: "Honey, insects, and ingredients made from animals such as gelatin, carmine and shellac.",
        sources: [{ id: "veganSociety" }],
        additives: ["en:e120", "en:e904", "en:e441", "en:e542", "en:e901"],
        terms: ["honey", "gelatin", "gelatine", "lard", "tallow", "suet", "carmine", "cochineal",
                "isinglass", "shellac", "beeswax", "collagen", "royal jelly", "lanolin"]
      },
      {
        type: "ingredients", level: "caution", label: "May be animal-derived",
        note: "These can come from plants or animals, and the label usually doesn't say which.",
        sources: [{ id: "off" }],
        analysisCaution: ["en:maybe-vegan"],
        additives: ["en:e920", "en:e471", "en:e472e"],
        terms: ["natural flavor", "natural flavour", "vitamin d3", "l-cysteine",
                "mono and diglycerides", "mono- and diglycerides"]
      }
    ]
  },

  /* ---------- 3. Diabetic ---------- */
  {
    id: "diabetic",
    name: "Diabetic",
    sources: ["cdc", "mayo", "nhs"],
    summary:
      "Limits added sugars, sugary drinks, refined grains and fruit juice, avoids trans fats, " +
      "and watches saturated fat and sodium (2,300 mg a day). Carb targets are personal, " +
      "so set yours with your doctor or a dietitian.",
    dailySodiumCapMg: 2300,
    showCarbsPerServing: true,
    rules: [
      {
        type: "ingredients", level: "avoid", label: "Sugary drinks",
        note: "Choose water or a low-calorie drink such as unsweetened iced tea instead.",
        sources: [{ id: "cdc" }],
        categories: ["en:sodas", "en:sweetened-beverages", "en:energy-drinks", "en:syrups"]
      },
      {
        type: "nutrient", label: "Sugar",
        note: "Over 22.5 g per 100 g is high and does not fit; over 5 g is a caution.",
        sources: [{ id: "cdc" }, { id: "nhs" }],
        nutrient: "sugars_100g", unit: "g", cautionAbove: 5, avoidAbove: 22.5
      },
      {
        type: "ingredients", level: "caution", label: "Added sugars",
        note: "Include fewer added sugars. Check where sugar falls in the ingredient list, since earlier means more.",
        sources: [{ id: "cdc" }, { id: "mayo" }],
        terms: ["sugar", "cane sugar", "brown sugar", "invert sugar", "corn syrup",
                "high fructose corn syrup", "glucose syrup", "dextrose", "sucrose", "maltose",
                "honey", "maple syrup", "agave", "molasses", "rice syrup", "fruit juice concentrate"],
        exceptions: ["no sugar added", "no added sugar", "sugar free", "sugar-free"]
      },
      {
        type: "ingredients", level: "caution", label: "Refined grains",
        note: "Include fewer refined grains such as white bread, rice and pasta.",
        sources: [{ id: "cdc" }],
        terms: ["enriched flour", "enriched wheat flour", "bleached flour", "white flour",
                "wheat flour", "white rice", "enriched semolina"],
        exceptions: ["whole wheat flour", "whole grain wheat flour", "whole-wheat flour"]
      },
      {
        type: "ingredients", level: "caution", label: "Fruit juice",
        note: "Juice raises blood sugar faster than whole fruit.",
        sources: [{ id: "cdc" }, { id: "mayo" }],
        categories: ["en:fruit-juices", "en:fruit-based-beverages", "en:nectars"]
      },
      {
        type: "ingredients", level: "avoid", label: "Trans fats",
        note: "Avoid trans fats in processed snacks, baked goods, shortening and stick margarine.",
        sources: [{ id: "mayo" }],
        terms: ["partially hydrogenated", "shortening"]
      },
      {
        type: "nutrient", level: "avoid", label: "Trans fat",
        sources: [{ id: "mayo" }],
        nutrient: "trans-fat_100g", unit: "g", max: 0
      },
      {
        type: "nutrient", level: "caution", label: "Saturated fat",
        note: "Limit high-fat dairy, fatty meats and coconut and palm kernel oils. Over 5 g per 100 g is high.",
        sources: [{ id: "mayo" }, { id: "nhs" }],
        nutrient: "saturated-fat_100g", unit: "g", cautionAbove: 5
      },
      {
        type: "nutrient", level: "caution", label: "Sodium",
        note: "Aim for no more than 2,300 mg of sodium a day, or less with high blood pressure. Over 600 mg per 100 g is high.",
        sources: [{ id: "mayo" }, { id: "nhs" }],
        nutrient: "sodium_100g", unit: "mg", scale: 1000, cautionAbove: 600
      }
    ]
  },

  /* ---------- No diet ---------- */
  {
    id: "none",
    name: "No diet (nutrition facts only)",
    sources: ["off"],
    rules: []
  }
];

if (typeof module !== "undefined") module.exports = { DIETS, SOURCES };

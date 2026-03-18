const meals = [
  { name: "Breakfast Burritos", description: "Scramble eggs, beans, cheese, and salsa into a warm tortilla.", tags: ["cheap", "lazy", "kid-friendly"] },
  { name: "Chicken Caesar Wrap", description: "Rotisserie chicken, lettuce, parmesan, and Caesar dressing wrapped tight.", tags: ["lazy"] },
  { name: "Veggie Fried Rice", description: "Rice, frozen vegetables, soy sauce, and a quick egg scramble.", tags: ["cheap", "lazy"] },
  { name: "Turkey Sandwich Stack", description: "Toasted bread, turkey, avocado, tomato, and mustard.", tags: ["lazy"] },
  { name: "Sheet Pan Sausage", description: "Sausage roasted with potatoes and peppers on one tray.", tags: ["kid-friendly"] },
  { name: "Lentil Soup", description: "A hearty pot of lentils, carrots, onion, and broth.", tags: ["cheap", "healthy"] },
  { name: "Pesto Pasta", description: "Hot pasta tossed with pesto and cherry tomatoes.", tags: ["cheap", "lazy"] },
  { name: "Taco Night", description: "Ground meat or beans, tortillas, cheese, lettuce, and salsa.", tags: ["kid-friendly"] },
  { name: "Greek Salad Bowl", description: "Cucumber, tomato, feta, olives, and chickpeas with lemon dressing.", tags: ["healthy"] },
  { name: "Grilled Cheese & Tomato Soup", description: "Classic comfort food with very little effort.", tags: ["cheap", "kid-friendly", "lazy"] },
  { name: "Baked Salmon & Rice", description: "Salmon fillet with lemon and a side of rice and greens.", tags: ["healthy"] },
  { name: "Quesadillas", description: "Cheese-filled tortillas crisped in a pan with optional chicken or beans.", tags: ["cheap", "kid-friendly", "lazy"] },
  { name: "Loaded Sweet Potatoes", description: "Baked sweet potatoes topped with black beans, yogurt, and herbs.", tags: ["healthy", "cheap"] },
  { name: "Chicken Stir-Fry", description: "Quick pan-fried chicken with broccoli and a bottled sauce.", tags: ["healthy"] },
  { name: "Pancake Dinner", description: "Breakfast for dinner with fruit and syrup.", tags: ["cheap", "kid-friendly"] },
  { name: "Turkey Chili", description: "Ground turkey, beans, tomatoes, and spices simmered together.", tags: ["healthy", "cheap"] },
  { name: "Caprese Toasts", description: "Toast with mozzarella, tomato, basil, and balsamic glaze.", tags: ["lazy"] },
  { name: "Burrito Bowls", description: "Rice, beans, corn, chicken, and toppings in one bowl.", tags: ["healthy", "kid-friendly"] },
  { name: "Peanut Noodles", description: "Pasta tossed with peanut sauce, cucumber, and scallions.", tags: ["cheap"] },
  { name: "Veggie Omelet", description: "Eggs folded around peppers, onions, and cheese.", tags: ["healthy", "lazy"] },
  { name: "Fish Tacos", description: "Crispy fish with cabbage and crema in tortillas.", tags: ["kid-friendly"] },
  { name: "Baked Ziti", description: "A cheesy baked pasta dish that reheats well.", tags: ["kid-friendly", "cheap"] },
  { name: "Chicken Noodle Soup", description: "Simple comfort bowl with broth, noodles, and chicken.", tags: ["lazy"] },
  { name: "Hummus Snack Plate", description: "Hummus, pita, carrots, cucumber, olives, and cheese.", tags: ["healthy", "lazy"] },
  { name: "Turkey Burgers", description: "Quick burgers with lettuce, tomato, and oven fries.", tags: ["kid-friendly"] },
  { name: "Teriyaki Meatballs", description: "Frozen meatballs glazed with teriyaki and served over rice.", tags: ["lazy", "kid-friendly"] },
  { name: "Black Bean Tostadas", description: "Crunchy tostadas layered with beans, avocado, and salsa.", tags: ["cheap", "healthy"] },
  { name: "Spinach Ravioli", description: "Store-bought ravioli with marinara and parmesan.", tags: ["lazy"] },
  { name: "Chicken Pita Pockets", description: "Chicken, cucumber, tomatoes, and tzatziki in pita bread.", tags: ["healthy"] },
  { name: "Mac and Peas", description: "Mac and cheese with peas folded in for an easy win.", tags: ["cheap", "kid-friendly", "lazy"] }
];

const categories = ["cheap", "healthy", "lazy", "kid-friendly"];
const activeFilters = new Set();

const filterGrid = document.getElementById("filterGrid");
const resultCard = document.getElementById("resultCard");
const pickMealButton = document.getElementById("pickMealButton");
const pickAgainButton = document.getElementById("pickAgainButton");
const clearFiltersButton = document.getElementById("clearFiltersButton");

function renderFilters() {
  filterGrid.innerHTML = "";

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip${activeFilters.has(category) ? " active" : ""}`;
    button.textContent = category;
    button.addEventListener("click", () => {
      if (activeFilters.has(category)) {
        activeFilters.delete(category);
      } else {
        activeFilters.add(category);
      }
      renderFilters();
    });
    filterGrid.appendChild(button);
  });
}

function getAvailableMeals() {
  if (activeFilters.size === 0) {
    return meals;
  }

  return meals.filter((meal) => [...activeFilters].every((filter) => meal.tags.includes(filter)));
}

function renderMeal(meal) {
  if (!meal) {
    resultCard.innerHTML = `<p class="result-state">No meals match that exact filter combo yet. Clear a filter and try again.</p>`;
    return;
  }

  resultCard.innerHTML = `
    <p class="eyebrow">Tonight's answer</p>
    <h2 class="meal-name">${meal.name}</h2>
    <p class="meal-description">${meal.description}</p>
    <div class="tag-row">
      ${meal.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
    </div>
  `;
}

function pickMeal() {
  const pool = getAvailableMeals();
  const meal = pool[Math.floor(Math.random() * pool.length)];
  renderMeal(meal);
}

pickMealButton.addEventListener("click", pickMeal);
pickAgainButton.addEventListener("click", pickMeal);
clearFiltersButton.addEventListener("click", () => {
  activeFilters.clear();
  renderFilters();
});

renderFilters();

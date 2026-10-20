const API_KEY = '9d6176d44ca441b59f4e89e2efc59118';

async function searchRecipes() {
    const query = document.getElementById('query').value;
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = 'Loading...';

    if (!query) {
        resultsDiv.innerHTML = 'Please enter a search term.';
        return;
    }

    try {
        const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=5&apiKey=${API_KEY}`);
        const data = await response.json();

        if (data.results.length === 0) {
            resultsDiv.innerHTML = 'No recipes found.';
            return;
        }

        resultsDiv.innerHTML = '';
        data.results.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <h3>${recipe.title}</h3>
                <img src="${recipe.image}" alt="${recipe.title}">
                <p><a href="https://spoonacular.com/recipes/${recipe.title.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')}-${recipe.id}" target="_blank" rel="noopener noreferrer">View Recipe Details</a></p>
                <button class="favorite-btn" type="button">♡ Favorite</button>
                <button class="grocery-btn" type="button">Add Ingredients to Grocery List</button>
            `;
            card.querySelector('.grocery-btn').addEventListener('click', () => {
                addRecipeIngredients(recipe.id);
            });
            card.querySelector('.favorite-btn').addEventListener('click', () => {
                saveFavorite(recipe.id, recipe.title);
            });
            resultsDiv.appendChild(card);
        });
    } catch (error) {
        resultsDiv.innerHTML = 'Failed to fetch recipes. Check your API key or network.';
    }
}

// Featured recipes: 3 random vegetarian recipes, saved for the rest of the browser session
  async function loadFeaturedRecipes() {
      const featuredDiv = document.getElementById('featured');
      let recipes = JSON.parse(sessionStorage.getItem('featuredRecipes'));

      if (!recipes) {
          try {
              const response = await
  fetch(`https://api.spoonacular.com/recipes/random?number=3&include-tags=vegetarian&apiKey=${API_KEY}`);
              if (!response.ok) {
                  throw new Error('Request failed');
              }
              const data = await response.json();
              recipes = data.recipes;
              sessionStorage.setItem('featuredRecipes', JSON.stringify(recipes));
          } catch (error) {
              featuredDiv.innerHTML = '<p>Could not load featured recipes.</p>';
              return;
          }
      }

      featuredDiv.innerHTML = '';
      recipes.forEach(recipe => {
          const card = document.createElement('div');
          card.className = 'feature-card';
          card.innerHTML = `
              <img src="${recipe.image}" alt="${recipe.title}">
              <h3>${recipe.title}</h3>
              <p>Ready in ${recipe.readyInMinutes} min · Serves ${recipe.servings}</p>
              <a href="${recipe.spoonacularSourceUrl}" target="_blank">View Recipe</a>
          `;
          featuredDiv.appendChild(card);
      });
  }

  loadFeaturedRecipes();

const loggedInUser = sessionStorage.getItem("nutriplanUser");

if (loggedInUser) {
    const loginLink = document.querySelector(
        'a[href="Login.html"], a[href="login.html"]'
    );

    if (loginLink) {
        loginLink.textContent = "Logout";
        loginLink.href = "#";

        loginLink.addEventListener("click", () => {
            sessionStorage.removeItem("nutriplanUser");
            window.location.href = "login.html";
        });
    }
}

async function saveFavorite(recipeId, recipeName) {
    const savedUser = sessionStorage.getItem('nutriplanUser');

    if (!savedUser) {
        alert('Please log in before saving favorites.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const user = JSON.parse(savedUser);

        const response = await fetch('http://localhost:3000/api/favorites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: user.id,
                recipeId: String(recipeId),
                recipeName: recipeName
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Recipe added to favorites!');
        } else {
            alert(data.error || 'Could not save this recipe.');
        }
    } catch (error) {
        console.error(error);
        alert('Could not connect to the backend.');
    }
}

async function addRecipeIngredients(recipeId) {
    const savedUser = sessionStorage.getItem('nutriplanUser');

    if (!savedUser) {
        alert('Please log in before adding ingredients.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const user = JSON.parse(savedUser);

        const response = await fetch(
            `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`
        );

        const recipe = await response.json();

        if (!response.ok) {
            alert(recipe.message || 'Could not retrieve ingredients.');
            return;
        }

        const ingredients = recipe.extendedIngredients || [];

        if (ingredients.length === 0) {
            alert('No ingredients found for this recipe.');
            return;
        }

        let added = 0;
        let failed = 0;

        for (const ingredient of ingredients) {
            const itemName = ingredient.original || ingredient.name;

            try {
                const result = await fetch(
                    'http://localhost:3000/api/grocery',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: user.id,
                            itemName
                        })
                    }
                );

                if (result.ok) {
                    added++;
                } else {
                    failed++;
                }
            } catch {
                failed++;
            }
        }

        alert(
            `${added} ingredient(s) added to your grocery list.` +
            (failed ? ` ${failed} could not be added; they may already exist.` : '')
        );

    } catch (error) {
        console.error(error);
        alert('Could not connect to Spoonacular or your backend.');
    }
}
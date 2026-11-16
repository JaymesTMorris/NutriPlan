const API_KEY = '9d6176d44ca441b59f4e89e2efc59118';
const recipeId = new URLSearchParams(window.location.search).get('id');

const loadingMessage = document.getElementById('loading-message');
const recipeArticle = document.getElementById('recipe');
const recipeTitle = document.getElementById('recipe-title');
const recipeImage = document.getElementById('recipe-image');
const recipeInfo = document.getElementById('recipe-info');
const recipeSummary = document.getElementById('recipe-summary');
const ingredientList = document.getElementById('ingredient-list');
const instructionList = document.getElementById('instruction-list');
const instructionText = document.getElementById('instruction-text');

async function loadRecipe() {
    if (!recipeId) {
        loadingMessage.textContent = 'No recipe selected.';
        return;
    }

    try {
        const response = await fetch(
            `https://api.spoonacular.com/recipes/${encodeURIComponent(recipeId)}/information?apiKey=${API_KEY}`
        );
        const recipe = await response.json();

        if (!response.ok) {
            loadingMessage.textContent = recipe.message || 'Could not load this recipe.';
            return;
        }

        document.title = `${recipe.title} - NutriPlan`;
        recipeTitle.textContent = recipe.title;
        recipeInfo.textContent = `Ready in ${recipe.readyInMinutes} min · Serves ${recipe.servings}`;

        if (recipe.image) {
            recipeImage.src = recipe.image;
            recipeImage.alt = recipe.title;
        } else {
            recipeImage.remove();
        }

        recipeSummary.innerHTML = (recipe.summary || '').replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1');

        (recipe.extendedIngredients || []).forEach(ingredient => {
            const item = document.createElement('li');
            item.className = 'ingredient-item';
            item.textContent = ingredient.original || ingredient.name;
            ingredientList.appendChild(item);
        });

        const steps = (recipe.analyzedInstructions || []).flatMap(section => section.steps || []);

        if (steps.length) {
            steps.forEach(step => {
                const item = document.createElement('li');
                item.className = 'instruction-step';
                item.textContent = step.step;
                instructionList.appendChild(item);
            });
            instructionText.remove();
        } else {
            instructionText.textContent = recipe.instructions
                ? recipe.instructions.replace(/<[^>]*>/g, ' ')
                : 'No instructions available.';
            instructionList.remove();
        }

        loadingMessage.remove();
        recipeArticle.hidden = false;
    } catch (error) {
        console.error(error);
        loadingMessage.textContent = 'Failed to load recipe. Check your API key or network.';
    }
}

loadRecipe();

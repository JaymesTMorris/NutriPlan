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
                <p><a href="https://spoonacular.com/recipes/${recipe.title.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')}-${recipe.id}" target="_blank">View Recipe Details</a></p>
            `;
            resultsDiv.appendChild(card);
        });
    } catch (error) {
        resultsDiv.innerHTML = 'Failed to fetch recipes. Check your API key or network.';
    }
}
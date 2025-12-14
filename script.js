class Recipe{

  constructor(meal) {
    this.id = meal.idMeal;
    this.name = meal.strMeal;
    this.image = meal.strMealThumb;
    this.category = meal.strCategory;
    this.ingredients = [];
    this.instruction = meal.strInstructions;
    this.tried = false;
    this.servings = 1;

    for (let i = 1; i <= 20;i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if(ingredient && ingredient.trim() !== ""){
        this.ingredients.push({
          name: ingredient.trim(),
          measure:measure ?  measure.trim() : '',
        })
      }
      
    }
  }
}
class RecipeManager{

  #recipes = []
  #favorites = [];

  constructor() {
    this.loadLocalstorage()
  }

  async fetchRecipes(searchName) {
    try {
      let response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchName)}`)
      if(!response.ok){
        throw new Error("invalid response");
      }

      const data = await response.json();

      if(!data.meals){
        this.#recipes = [];
        return null;
      }
      this.#recipes = data.meals.map(meal=> new Recipe(meal))
      
    } catch (error) {
      console.log(error)
    }

  }

  async fetchCategory(searchCat) {
    try {
      let response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(searchCat)}`)
      if(!response.ok){
        throw new Error("invalid response");
      }

      const data = await response.json();

      if(!data.meals){
        this.#recipes = [];
        return null;
      }
      const detailrecipe = await Promise.all(
        data.meals.map((meal) => this.fetchID(meal.idMeal))
      )

      this.#recipes = detailrecipe.filter(r => r !== null)
      
    } catch (error) {
      console.log(error)
    }

  }

  async fetchIngredient(searchInd) {
    try {
      let response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(searchInd)}`)
      if(!response.ok){
        throw new Error("invalid response");
      }

      const data = await response.json();

      if(!data.meals){
        this.#recipes = [];
        return null;
      }
      const detailrecipe = await Promise.all(
        data.meals.map((meal) => this.fetchID(meal.idMeal))
      )

      this.#recipes = detailrecipe.filter(r => r !== null)
      
    } catch (error) {
      console.log(error)
    }

  }

    async fetchID(Id) {
    try {
      let response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(Id)}`)
      if(!response.ok){
        throw new Error("invalid response");
      }

      const data = await response.json();

     return data.meals ? new Recipe(data.meals[0]) : null;
      
    } catch (error) {
      console.log(error)
    }

  }



  deleteBtn(Id){
    this.#favorites = this.#favorites.filter(f => f.id !== Id);
    this.saveLocalStorage()
  }

  Favorites(Id){
    let recipe = this.#recipes.find(f => f.id === Id)

    if(!recipe) return;

    let alreadyfav = this.#favorites.find(f => f.id === Id)

    if(alreadyfav){
      this.#favorites = this.#favorites.filter(f => f.id !== Id)
    } else{
      this.#favorites.push(recipe)
    }

    this.saveLocalStorage();
  }

  favCount(){
    return this.#favorites.length;
  }

  getFavorites(){
    return this.#favorites;
  }

  getRecipe(){
    return this.#recipes;
  }


  filteringFav(filter){
    let fav = this.getFavorites()

    if(filter === "favall"){
      return fav;
    } else if(filter === "favtried"){
      return fav.filter(f => f.tried)
    } else if(filter === "favtotry"){
      return fav.filter(f => !f.tried)
    }

    return fav
  }


  marktry(Id){
    let fav = this.#favorites.find(s => s.id === Id)
    if(!fav) return;
   fav.tried = !fav.tried;
    this.saveLocalStorage()
    return fav.tried
  }

  countTried(){
    return this.#favorites.filter(f => f.tried).length;
  }

  countTotry(){
    return this.#favorites.filter(f => !f.tried).length;
  }

  scalemeasure(measure,multiplier){
    const numbermatch = measure.match('/[\d.\/]+/');
    if(!numbermatch) return measure;

    let number = numbermatch[0];

    if(number.includes('/')){
      const [num,den] = number.split('/').map(Number);
      number = num/den
    } else{
      number = parseFloat(number);
    }

    const scaled = number * multiplier;

    if(scaled % 1 === 0.5){
      return measure.replace(numbermatch[0], `${Math.floor(scaled)} 1/2`);
    } else if(scaled % 1 === 0.25){
      return measure.replace(numbermatch[0], `${Math.floor(scaled)} 1/4`);
    } else{
      return measure.replace(numbermatch[0] , scaled.toFixed(1))
    }
  };

  scaleIngredients(recipeId, newServings){
    const recipe = this.#recipes.find(f => f.id === recipeId)

    if(!recipe) return;

    const multiplier = newServings / recipe.servings;

    recipe.ingredients = recipe.ingredients.map(ing => {
      const scaleMeasure = this.scalemeasure(ing.measure , multiplier);
      return {
        ...ing,
        measure: scaleMeasure
      };
    })

    recipe.servings = newServings;
    this.saveLocalStorage();
  }

  generateShoppingList(){
    const generator = new ShoppingListgenerator();
    return generator.generateList(this.#favorites)
  }



  saveLocalStorage(){
    localStorage.setItem("recipe" ,JSON.stringify(this.#recipes))
    localStorage.setItem("favorites" , JSON.stringify(this.#favorites))
  }

  loadLocalstorage(){
    let recipe = localStorage.getItem("recipe");
    let favorites = localStorage.getItem("favorites")
    if(recipe){

      try {
        let parse = JSON.parse(recipe)
          this.#recipes = parse.map(item => ({
        ...item,
        tried: item.tried ?? false,
        servings: item.servings ?? 1,
        ingredients: item.ingredients || []
      }));
    } catch (error) {
      this.#recipes = [];
    }
      
    }

    
    if(favorites){
      try {
        let favparse = JSON.parse(favorites)
          this.#favorites = favparse.map(item => ({
        ...item,
        tried: item.tried ?? false,
        ingredients: item.ingredients || []
      }));
      } catch (error) {
        this.#favorites = [];
      }
    }
  }


}

class ShoppingListitem{
  constructor(name , measure , recipeName){
    this.name = name;
    this.measure = measure;
    this.recipes = recipeName
  }
}

class ShoppingListgenerator{
  
 generateList(recipes) {
  const ingredientsMap = new Map();

  recipes.forEach(recipe => {
    recipe.ingredients.forEach(ing => {
      const key = ing.name.toLowerCase();

      if (ingredientsMap.has(key)) {
        const existing = ingredientsMap.get(key);
        existing.measure = this.combineMeasures(existing.measure, ing.measure);
        existing.recipes.push(recipe.name);
      } else {
        ingredientsMap.set(
          key,
          new ShoppingListitem(ing.name, ing.measure, [recipe.name])
        );
      }
    });
  });

  return Array.from(ingredientsMap.values());
}


  combineMeasures(measure1 , measure2){
    return `${measure1} + ${measure2}`
  }
}
class UIRenderer{
  constructor(manager) {
    this.manager = manager
  }

  renderrecipeList(list){
    let recipelist = document.getElementById("searchList");
    let recipes = list || this.manager.getRecipe();

    recipelist.innerHTML = recipes.map(recipe => {
      let fav = this.manager.getFavorites().some(f => f.id === recipe.id)
      let mark = fav ? this.manager.getFavorites().find(f => f.id === recipe.id).tried : false;
        let isFavoritesPage = document.getElementById("favorites").classList.contains("active");

      
      return `
      <div class="recipe-content">
          <div>
            <img src="${recipe.image}" alt="${recipe.name}" class="recipe-poster" 
                 onerror="this.src='https://via.placeholder.com/200x500?text=No+Poster'">
          </div>
          <div class="recipe-details">
            <h2>${recipe.name}</h2>
            <span class="material-icons heartIconList" style="color: ${fav ? "red" : 'grey'}" data-id="${recipe.id}">favorite</span>
            <div class="recipe-info">
              <span>${recipe.category}</span>
              <span class="ingredient-list">${recipe.ingredients.map(f => f.name + " " + f.measure).join(', ')}</span>
            </div>
            <div class="serving-adjuster">
            <label>Servings:</label>
            <button class="servingBtn" data-id="${recipe.id}" data-action="decrease">-</button>
            <span class="servingCount">${recipe.servings}</span>
            <button class="servingBtn" data-id="${recipe.id}" data-action="increase">+</button>
            </div>
            <p class="recipe-Instructions">${recipe.instruction}</p>
            <div class="twoBtn">
            <button class="markBtn ${mark ? 'Marked' : ''}" data-id="${recipe.id}">${mark ? "Tried" : "Mark to tried"}</button>
          ${isFavoritesPage ? `<button class="deleteBtn" data-id="${recipe.id}">Delete</button>` : ''}
          </div>
          </div>
        </div>
      `}).join('');


  }

  renderfavCounts(){
    let tried = document.getElementById("triedfav");
    let totry =  document.getElementById("tryfav");

    let triedcount = this.manager.countTried();
    let trycount = this.manager.countTotry();

    tried.textContent = `Tried(${triedcount})`;
    totry.textContent = `to Try(${trycount})`;
  }

  renderAll(){
    this.renderrecipeList();
    this.renderfavCounts();
  }

  renderShoppingList(items) {
  const content = document.getElementById("shoppingListContent");
  
  content.innerHTML = items.map(item => `
    <div class="shopping-item">
      <input type="checkbox" id="item-${item.name}">
      <label for="item-${item.name}">
        <strong>${item.name}</strong> - ${item.measure}
        <br>
        <small>For: ${item.recipes.join(', ')}</small>
      </label>
    </div>
  `).join('');
}

  
}
class App{
constructor() {
  this.manager = new RecipeManager();
  this.renderer = new UIRenderer(this.manager)

  this.currentfilter = 'favall'

  this.saveeventListener();
  this.renderer.renderAll();
}

saveeventListener(){
let home = document.getElementById("Home");
let fav = document.getElementById("favorites");
let searchdiv = document.getElementById("searchfilter")
let favdiv = document.getElementById("favFilterpart");
let h2 = document.getElementById("heading2") 

home.addEventListener("click" , ()=>{
  favdiv.style.display = "none"
  searchdiv.style.display = "block";
    h2.style.display = "block"



  home.classList.add("active");
  fav.classList.remove("active");
  this.renderer.renderrecipeList(this.manager.getRecipe())
})

fav.addEventListener("click" , ()=>{
  favdiv.style.display = "block"
  searchdiv.style.display = "none";
  h2.style.display = "none"


  home.classList.remove("active");
  fav.classList.add("active");

  this.renderer.renderrecipeList(this.manager.filteringFav(this.currentfilter))
})


document.getElementById("searchBtn").addEventListener("click" , async () => {
  let search = document.getElementById("searchInput");
  let searchValue =  search.value.trim();

  if(search.value.trim() === ""){
    alert("please enter the name of the recipe")
    return
  }

    const activeFilter = document.querySelector(".filter.searchactive")
    const filter =activeFilter.dataset.filter;

    if(filter === "byname"){
      await this.manager.fetchRecipes(searchValue)
    } else if(filter === "byingredient"){
      await this.manager.fetchIngredient(searchValue)
    } else if(filter === "bycategory"){
      await this.manager.fetchCategory(searchValue)
    }


  search.value = "";
  this.renderer.renderrecipeList(this.manager.getRecipe())
  this.renderer.renderfavCounts();
});

document.getElementById("searchList").addEventListener("click" , (e) => {
  if(e.target.classList.contains("heartIconList")){
    let id = e.target.dataset.id
    this.manager.Favorites(id);
    if (home.classList.contains("active")) {
  this.renderer.renderrecipeList(this.manager.getRecipe());
} else {
  this.renderer.renderrecipeList(this.manager.filteringFav(this.currentfilter));
}

  }


  if(e.target.classList.contains("markBtn")){
    let id = e.target.dataset.id
    this.manager.marktry(id);
    if (home.classList.contains("active")) {
  this.renderer.renderrecipeList(this.manager.getRecipe());
} else {
  this.renderer.renderrecipeList(this.manager.filteringFav(this.currentfilter));
}

this.renderer.renderfavCounts()

  
  }

  if(e.target.classList.contains("deleteBtn")){
    let id = e.target.dataset.id
    this.manager.deleteBtn(id);
    if(home.classList.contains("active")){
      this.renderer.renderrecipeList(this.manager.getRecipe())
    } else{
      this.renderer.renderrecipeList(this.manager.filteringFav(this.currentfilter))
    };
    this.renderer.renderfavCounts()
  }
});

document.querySelector(".favoriteFilter").addEventListener("click" , (e) => {
  if(e.target.classList.contains("filterFav")){
    this.currentfilter = e.target.dataset.filter;

    document.querySelectorAll(".filterFav").forEach(button => {
      button.classList.remove("activefav")
    })

    e.target.classList.add("activefav")

    this.renderer.renderfavCounts()
    this.renderer.renderrecipeList(this.manager.filteringFav(this.currentfilter));

  }
})

document.querySelector(".searchfiltering").addEventListener("click" , (e) => {
  if(e.target.classList.contains("filter")){
    this.currentfilter = e.target.dataset.filter;

    document.querySelectorAll(".filter").forEach(button => {
      button.classList.remove("searchactive")
    })

    e.target.classList.add("searchactive")

    const filtertype = e.target.dataset.filter;

    let searchinp = document.getElementById("searchInput")
    if(filtertype === "byname"){
      searchinp.placeholder = "Enter Recipe Name"
    } else if(filtertype === "byingredient"){
      searchinp.placeholder = "Enter Recipe Ingredient"
    } else if(filtertype === "bycategory"){
      searchinp.placeholder = "Enter Recipe Category"
    }

    this.renderer.renderfavCounts()
    this.renderer.renderrecipeList(this.manager.getRecipe());

  }
})


document.getElementById("searchList").addEventListener("click" , (e)=>{
  if(e.target.classList.contains("servingBtn")){
    let id = e.target.dataset.id;
    let action = e.target.dataset.action;
    let recipe = this.manager.getRecipe().find(f => f.id === id);

    if(!recipe) return;

    const newServings = action === "increase" ? recipe.servings + 1 : Math.max(1 , recipe.servings -1);

    this.manager.scaleIngredients(id , newServings);
    this.renderer.renderrecipeList(this.manager.getRecipe());
    }
})


document.getElementById("generateShoppingList").addEventListener("click", () =>{
  const shoppingList = this.manager.generateShoppingList();
  this.renderer.renderShoppingList(shoppingList);
  document.getElementById("shoppingListModal").style.display = "block";
})

document.querySelector(".close").addEventListener("click" , () => {
  document.getElementById("shoppingListModal").style.display = "none"
})



}

}

let app =  new App();

  // fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=pasta')  justtesting the fetch data
  // .then(res => res.json())
  // .then(data => console.log(data))

  // let manager = new RecipeManager();
  // console.log(manager.getRecipe())
  // console.log(manager.getFavorites())
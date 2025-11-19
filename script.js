class Recipe{

  constructor(meal) {
    this.id = meal.idMeal;
    this.name = meal.strMeal;
    this.image = meal.strMealThumb;
    this.category = meal.strCategory;
    this.ingredients = [];
    this.instruction = meal.strInstructions;
    this.tried = false

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
    // this.loadLocalstorage()
  }

  async fetchRecipes(searchName) {
    try {
      let response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${searchName}`)
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
  }


  marktry(Id){
    let fav = this.#favorites.find(s => s.id === Id)
    if(!fav) return;
    this.saveLocalStorage()
   return fav.tried = !fav.tried;
  }

  countTried(){
    return this.#favorites.filter(f => f.tried).length;
  }

  countTotry(){
    return this.#favorites.filter(f => !f.tried).length;
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
          tried: item.tried || false
        }))
      
    } catch (error) {
      this.#recipes = [];
    }
      
    }

    
    if(favorites){
      try {
        let favparse = JSON.parse(favorites)
        this.#favorites = favparse.map(item => ({
          ...item ,
          tried: item.tried || false
        }))
        
      } catch (error) {
        this.#favorites = [];
      }
    }
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
            <p class="recipe-Instructions">${recipe.instruction}</p>
            <button class="markBtn ${mark ? 'Marked' : ''}" data-id="${recipe.id}">${mark ? "Tried" : "Mark to tried"}</button>
          ${isFavoritesPage ? `<button class="deleteBtn" data-id="${recipe.id}">Delete</button>` : ''}
          </div>
        </div>
      `}).join('');


  }

  renderfavCounts(){
    let all = document.getElementById("allfav");
    let tried = document.getElementById("triedfav");
    let totry =  document.getElementById("tryfav");

    let allcount = this.manager.favCount();
    let triedcount = this.manager.countTried();
    let trycount = this.manager.countTotry();

    all.textContent = `All(${allcount})`;
    tried.textContent = `Tried(${triedcount})`;
    totry.textContent = `to Try(${trycount})`;
  }

  renderAll(){
    this.renderrecipeList();
    this.renderfavCounts();
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
let searchdiv = document.getElementById("seachfiltering")
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

  if(search.value.trim() === ""){
    alert("please enter the name of the recipe")
    return
  }

  await this.manager.fetchRecipes(search.value.trim());


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



}

}

let app =  new App();

  fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=pasta')
  .then(res => res.json())
  .then(data => console.log(data))

  let manager = new RecipeManager();
  console.log(manager.getRecipe())
  console.log(manager.getFavorites())
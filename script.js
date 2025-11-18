class Recipe{

  constructor(meal) {
    this.id = meal.idMeal;
    this.name = meal.strMeal;
    this.image = meal.strMealthumb;
    this.category = meal.strCategory;
    this.ingredients = [];
    this.instruction = meal.strInstruction;
    this.tried = false

    for (let i = 0; i <= 20;i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if(measure && ingredient.trim() !== ""){
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
    this.#recipes = this.#recipes.filter(f => f.id !== Id)
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


  markfav(Id){
    let fav = this.#favorites.find(s => s.id === Id)
    if(!fav) return;
    fav.tried = !fav.tried;
  }

  countTried(){
    return this.#favorites.filter(f => f.tries).length;
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
      let parse = JSON.parse(recipe)
      this.#recipes = parse.map(item => new Recipe(item))
    }

    if(favorites){
      let favparse = JSON.parse('favorites')
      if(favparse){
        this.#favorites = favparse.map(item => new Recipe(item))
      }
    }
  }


}
class UIRenderer{
  constructor(manager) {
    this.manager = manager
  }

  
}
class App{
constructor() {
  this.manager = new RecipeManager();
  this.renderer = new UIRenderer(this.manager)

  this.saveeventListener();
}

saveeventListener(){
let home = document.getElementById("Home");
let fav = document.getElementById("favorites");
let searchdiv = document.getElementById("seachfiltering")
let favdiv = document.getElementById("favFilterpart")

home.addEventListener("click" , ()=>{
  favdiv.style.display = "none"
  searchdiv.style.display = "block";

  home.classList.add("active");
  fav.classList.remove("active")
})

fav.addEventListener("click" , ()=>{
  favdiv.style.display = "block"
  searchdiv.style.display = "none";

  home.classList.remove("active");
  fav.classList.add("active")
})

}

}

let app =  new App()

  fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=pasta')
  .then(res => res.json())
  .then(data => console.log(data))
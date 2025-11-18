class Recipe{}
class RecipeManager{}
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
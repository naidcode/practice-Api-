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

  
}

}

let app =  new App()
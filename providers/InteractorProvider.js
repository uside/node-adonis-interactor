const { ServiceProvider } = require("@adonisjs/fold");

class InteractorProvider extends ServiceProvider {
  register() {
    this.app.singleton("Interactor", () => {
      const Logger = this.app.use("Adonis/Src/Logger");
      return require("../src/Interactor")(Logger);
    });
  }
}

module.exports = InteractorProvider;

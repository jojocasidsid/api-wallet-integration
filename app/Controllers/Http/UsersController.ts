import User from "App/Models/User";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { rules, schema } from "@ioc:Adonis/Core/Validator";
export default class UsersController {
  public async register({ request, response }: HttpContextContract) {
    //validate

    const validations = await schema.create({
      email: schema.string({}, [
        rules.email(),
        rules.unique({ table: "users", column: "email" }),
      ]),
      password: schema.string({}, [rules.confirmed()]),
      username: schema.string({}, [
        rules.unique({ table: "users", column: "username" }),
      ]),
    });

    const data = await request.validate({ schema: validations });
    const user = await User.create(data);

    return response.created(user);
  }
  public login() {
    return "login";
  }
  public logout() {
    return "logout";
  }
}

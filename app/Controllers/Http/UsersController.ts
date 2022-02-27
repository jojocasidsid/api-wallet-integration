//adonis functions
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { rules, schema } from "@ioc:Adonis/Core/Validator";

//packages
import { ethers } from "ethers";

//models
import User from "App/Models/User";
import Wallet from "App/Models/Wallet";
import ApiToken from "App/Models/ApiToken";

export default class UsersController {
  public async register({ request }: HttpContextContract) {
    //create user
    const validations = schema.create({
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

    const wallet = ethers.Wallet.createRandom();
    const createWallet = await Wallet.create({
      userId: user.id,
      private_key: wallet.privateKey,
      public_key: wallet.address,
    });

    return { user, createWallet };
  }

  public async login({ request, response, auth }: HttpContextContract) {
    const email = request.input("email");
    const username = request.input("username");
    const password = request.input("password");

    try {
      const user = await User.findBy("email", email);
      if (user) {
        const isRevoked = await ApiToken.query()
          .where("user_id", "=", user.id)
          .where("is_revoked", false);
        if (isRevoked.length !== 0) {
          return response.json("user is already logged in");
        } else {
          const token = await auth.use("api").attempt(email, password);

          return token.toJSON();
        }
      }
      return response.badRequest("Invalid credentials");
    } catch (e) {
      return response.badRequest("Invalid credentials");
    }
  }

  public async logout({ auth, response }: HttpContextContract) {
    try {
      await auth.use("api").revoke();

      return response.json("User is logged out");
    } catch (e) {
      return response.badRequest("Invalid credentials");
    }
  }
}

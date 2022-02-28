//adonis functions
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { rules, schema } from "@ioc:Adonis/Core/Validator";
import Hash from "@ioc:Adonis/Core/Hash";
import { OpaqueTokenContract } from "@ioc:Adonis/Addons/Auth";
import Env from "@ioc:Adonis/Core/Env";

//packages
import { ethers } from "ethers";

//models
import User from "App/Models/User";
import Wallet from "App/Models/Wallet";
import ApiToken from "App/Models/ApiToken";

export default class UsersController {
  badRequestString = "Invalid Credentials!";

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

    const userWallet = ethers.Wallet.createRandom();
    const createWallet = await Wallet.create({
      userId: user.id,
      private_key: userWallet.privateKey,
      public_key: userWallet.address,
    });

    const provider = new ethers.providers.JsonRpcProvider(
      "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
    );

    const privateKey = Env.get("SERVER_PRIVATE_KEY");
    const wallet = new ethers.Wallet(privateKey, provider);
    const receiverAddress = userWallet.address;
    const amountInEther = "0.01";

    const tx = {
      to: receiverAddress,
      // Convert currency unit from ether to wei
      value: ethers.utils.parseEther(amountInEther),
    };

    const txObj = await wallet.sendTransaction(tx);

    return { user, createWallet, txObj };
  }

  public async login({ request, response, auth }: HttpContextContract) {
    const username = request.input("username");
    const email = request.input("email");
    const password = request.input("password");

    try {
      let user: User | null;
      if (username) {
        user = await User.findBy("username", username);
      } else {
        user = await User.findBy("email", email);
      }

      if (user) {
        if (!(await Hash.verify(user.password, password))) {
          return response.badRequest("Invalid credentials");
        }

        const isRevoked = await ApiToken.query().where("user_id", "=", user.id);

        if (isRevoked.length !== 0) {
          return response.json("user is already logged in");
        } else {
          let token: OpaqueTokenContract<User>;

          if (username) {
            token = await auth.use("api").attempt(username, password);
          } else {
            token = await auth.use("api").attempt(email, password);
          }

          return token.toJSON();
        }
      }
      return response.badRequest(this.badRequestString);
    } catch {
      return response.badRequest(this.badRequestString);
    }
  }

  public async logout({ auth, response }: HttpContextContract) {
    try {
      await auth.use("api").revoke();
      return response.json("User is logged out");
    } catch (e) {
      return response.badRequest(this.badRequestString);
    }
  }
}

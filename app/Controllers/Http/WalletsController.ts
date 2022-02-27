import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

import { ethers } from "ethers";
import Env from "@ioc:Adonis/Core/Env";

import Wallet from "App/Models/Wallet";
import Encryption from "@ioc:Adonis/Core/Encryption";
export default class WalletsController {
  abi = [
    {
      inputs: [],
      name: "retrieve",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "num",
          type: "uint256",
        },
      ],
      name: "store",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

  public async store({ request, auth, response }: HttpContextContract) {
    const number = request.input("number");

    const user = await auth.use("api").authenticate();
    const { id } = user;
    const userWallet = await Wallet.findBy("user_id", id);

    if (userWallet) {
      const decryptedKey: string | null = Encryption.decrypt(
        userWallet.private_key
      );

      const provider = new ethers.providers.JsonRpcProvider(
        "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
      );

      if (decryptedKey) {
        const wallet = new ethers.Wallet(decryptedKey, provider);

        const contract = new ethers.Contract(
          Env.get("SMART_CONTRACT_ADDRESS"),
          this.abi,
          wallet
        );

        const walletBalance = ethers.BigNumber.from(
          await provider.getBalance(wallet.address)
        );

        if (ethers.utils.formatUnits(walletBalance)) {
          const transaction = await contract.store(
            ethers.utils.parseEther(number)
          );

          await transaction.wait();
          return { transaction };
        }

        return response.badRequest("No funds!");
      }
      return response.badRequest("Invalid Credentials!");
    }

    return response.badRequest("Invalid Credentials!");
  }

  public async retrieve({ auth, response }: HttpContextContract) {
    const user = await auth.use("api").authenticate();
    const { id } = user;
    const userWallet = await Wallet.findBy("user_id", id);

    if (userWallet) {
      const decryptedKey: string | null = Encryption.decrypt(
        userWallet.private_key
      );

      const provider = new ethers.providers.JsonRpcProvider(
        "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
      );

      if (decryptedKey) {
        const wallet = new ethers.Wallet(decryptedKey, provider);

        const contract = new ethers.Contract(
          Env.get("SMART_CONTRACT_ADDRESS"),
          this.abi,
          wallet
        );

        const res = await contract.retrieve();
        const convertRes = ethers.BigNumber.from(res);

        return ethers.utils.formatUnits(convertRes);
      }
    }

    return response.badRequest("Invalid Credentials!");
  }
}

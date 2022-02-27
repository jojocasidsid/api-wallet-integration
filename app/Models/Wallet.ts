import { DateTime } from "luxon";
import User from "App/Models/User";
import {
  beforeSave,
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
} from "@ioc:Adonis/Lucid/Orm";
import Encryption from "@ioc:Adonis/Core/Encryption";

export default class Wallet extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column()
  public private_key: string;

  @column()
  public public_key: string;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  //wallet -> user relationship
  @column()
  public userId: number;

  @beforeSave()
  public static async encryptPrivateKey(wallet: Wallet) {
    if (wallet.$dirty.private_key) {
      wallet.private_key = Encryption.encrypt(wallet.private_key);
    }
  }

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>;
}

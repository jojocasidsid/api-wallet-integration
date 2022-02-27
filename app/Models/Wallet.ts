import { DateTime } from "luxon";
import User from "App/Models/User";
import { BaseModel, column, belongsTo, BelongsTo } from "@ioc:Adonis/Lucid/Orm";

export default class Wallet extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  //wallet -> user relationship
  @column()
  public userId: number;

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>;
}

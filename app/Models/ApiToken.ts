import User from "App/Models/User";

import { DateTime } from "luxon";
import { BelongsTo, belongsTo, BaseModel, column } from "@ioc:Adonis/Lucid/Orm";

export default class ApiToken extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column()
  public type: string;

  @column()
  public name: string;

  @column()
  public userId: number;

  @column()
  public token: string;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>;
}

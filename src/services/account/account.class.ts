import { BadRequest, GeneralError } from "@feathersjs/errors";
import { Paginated, Params } from "@feathersjs/feathers";
import { Service, MongooseServiceOptions } from "feathers-mongoose";
import { Application } from "../../declarations";
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

interface Data {
  userId: String;
  accountName: String;
  initialBalance: number;
}

interface Response {
  total: number;
  limit: number;
  skip: number;
  data: any[];
}

export class Account extends Service {
  app: Application;
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<MongooseServiceOptions>, app: Application) {
    super(options);
    this.app = app;
  }

  async create(data: Data, params?: Params) {
    try {
      const { userId, accountName, initialBalance } = data;

      if (!userId) throw new BadRequest("userId must be provided")

      const user: Paginated<Response> | Response[] = await this.app
        .service("users")
        .find({ query: { userId } });

      if (_.isArray(user)) throw new GeneralError("Users must be paginated");
      if (!user.total) throw new GeneralError("This user doesn't exist");

      const newAccount = {
        accountId: uuidv4(),
        accountName,
        userId,
        balance: initialBalance || 0,
      };
      this.options.Model.create(newAccount);
      return newAccount;
    } catch (e: any) {
      if (e instanceof BadRequest) throw e;
      throw new BadRequest("User with this userId doesn't exist.");
    }
  }
}

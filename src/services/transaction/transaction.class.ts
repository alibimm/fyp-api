import { BadRequest, GeneralError } from "@feathersjs/errors";
import { NullableId, Paginated, Params } from "@feathersjs/feathers";
import { Service, MongooseServiceOptions } from "feathers-mongoose";
import { Application } from "../../declarations";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";

interface Data {
  userId: string;
  amount: number;
  type: string;
  baseAccount: string;
  destinationAccount?: string;
  category?: string;
}

interface Response {
  total: number;
  limit: number;
  skip: number;
  data: any[];
}

interface Account {
  _id: NullableId;
  acountId: string;
  balance: number;
}

export class Transaction extends Service {
  app: Application;
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<MongooseServiceOptions>, app: Application) {
    super(options);
    this.app = app;
  }

  async create(data: Data, params?: Params) {
    try {
      const { userId, amount, type, baseAccount, destinationAccount, category } = data;

      if (!userId) throw new BadRequest("userId must be provided");
      if (!amount) throw new BadRequest("Amount must be provided");

      const user: Paginated<Response> | Response[] = await this.app
        .service("users")
        .find({ query: { userId } });
      if (_.isArray(user)) throw new GeneralError("Users must be paginated");
      if (!user.total) throw new GeneralError("This user doesn't exist");

      const accFrom: Account[] | Paginated<Account> = await this.app
        .service("account")
        .find({ query: { accountId: baseAccount }, paginate: false });
      if (!_.isArray(accFrom))
        throw new GeneralError("Accounts must not be paginated");
      if (!accFrom.length)
        throw new GeneralError("This account from doesn't exist");

      let accTo: Account[] | Paginated<Account> | any = null;
      if (type === "transfer") {
        accTo = await this.app
          .service("account")
          .find({ query: { accountId: destinationAccount }, paginate: false });
        if (!_.isArray(accTo))
          throw new GeneralError("Accounts must not be paginated");
        if (!accTo.length)
          throw new GeneralError("This account from doesn't exist");
      }

      // update the balances
      const newFromBalance = calculateNewBalance(
        accFrom[0].balance,
        amount,
        type,
        true
      );
      this.app
        .service("account")
        .patch(accFrom[0]._id, { balance: newFromBalance });

      if (type === "transfer") {
        const newToBalance = calculateNewBalance(
          accTo[0].balance,
          amount,
          type,
          false
        );
        this.app
          .service("account")
          .patch(accTo[0]._id, { balance: newFromBalance });
      }

      const newTransaction = {
        transactionId: uuidv4(),
        userId,
        amount,
        type,
        baseAccount,
        destinationAccount,
        category,
      };
      this.options.Model.create(newTransaction);
      return newTransaction;
    } catch (e: any) {
      if (e instanceof BadRequest) throw e;
      throw new BadRequest("User with this userId doesn't exist.");
    }
  }
}

const calculateNewBalance = (
  prevBalance: number,
  amount: number,
  type: string,
  isFrom: boolean
): number => {
  const willAdd = type === "income" || (type === "transfer" && !isFrom);
  return willAdd ? prevBalance + amount : prevBalance - amount;
};

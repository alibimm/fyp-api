import { Service, MongooseServiceOptions } from "feathers-mongoose";
import { Application } from "../../declarations";
import { v4 as uuidv4 } from "uuid";
import { Paginated, Params } from "@feathersjs/feathers";
import { BadRequest, GeneralError } from "@feathersjs/errors";
import _ from "lodash";

interface Data {
  email: String;
  password: String;
}

interface Response {
  total: number;
  limit: number;
  skip: number;
  data: any[];
}

export class Users extends Service {
  app: Application;

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<MongooseServiceOptions>, app: Application) {
    super(options);
    this.app = app;
  }

  async create(data: Data, params?: Params) {
    try {
      const { email, password } = data;

      const user: Paginated<Response> | Response[] = await this.app
        .service("users")
        .find({ query: { email } });

      if (_.isArray(user)) throw new GeneralError("Users must be paginated");
      if (user.total) throw new GeneralError("User already exists");

      const newUser = {
        userId: uuidv4(),
        email,
        password,
      };
      this.options.Model.create(newUser);
      return {
        userId: newUser.userId,
        email: newUser.email,
      };
    } catch (e) {
      throw new BadRequest("User with this email already exists.");
    }
  }
}

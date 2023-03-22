import { Application } from '../declarations';
import users from './users/users.service';
import account from './account/account.service';
import transaction from './transaction/transaction.service';
// Don't remove this comment. It's needed to format import lines nicely.

export default function (app: Application): void {
  app.configure(users);
  app.configure(account);
  app.configure(transaction);
}

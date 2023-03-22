import { Hook, HookContext } from '@feathersjs/feathers';

export const logger = (): Hook => {
  return async (context: HookContext) => {

    console.log('Params:', context.params);
    return context;

  };
};
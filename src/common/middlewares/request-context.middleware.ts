import {
  ForbiddenException,
  Injectable,
  Logger,
  NestMiddleware,
  Scope,
} from '@nestjs/common';
import { RequestContextPreparationService as RequestContextPreparationService } from '../context/request-context.service';

@Injectable({ scope: Scope.REQUEST })
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private requestPreparation: RequestContextPreparationService) {}
  use(req: any, res: any, next: () => void) {
    if (this.requestPreparation) {
      this.requestPreparation
        .prepareContext(req, res)
        .then((d) => {
          next();
        })
        .catch((e) => {
          Logger.error(e);
          throw new ForbiddenException();
        });
    } else {
      Logger.error('requestPreparation is null');
      next();
    }
  }
}

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: any, response: any, next: any): void {
    const { ip, method, url } = request;
    const request_time = Date.now();
    const userAgent = request.headers['user-agent'] || '';

    response.on('finish', () => {
      const response_time = Date.now();
      const response_took = response_time - request_time;
      const { statusCode } = response;
      const contentLength = this.getHeader(response._header, 'content-length');

      this.logger.log(
        `${method} ${url} ${statusCode} ${contentLength} - ${userAgent} ${ip} ${request_time} ${response_took}`,
      );
    });

    next();
  }

  private getHeader(headers: string, header_key: string): string {
    return this.parseHeader(headers)[header_key];
  }
  private trim(string: string) {
    return string.replace(/^\s+|\s+$/g, '');
  }
  private isArray(arg: any) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  }
  private parseHeader(headers: string): any {
    if (!headers) {
      return {};
    }
    const result: any = {};

    const headersArr = this.trim(headers).split('\n');

    for (let i = 0; i < headersArr.length; i++) {
      const row = headersArr[i];
      const index = row.indexOf(':');
      const key = this.trim(row.slice(0, index)).toLowerCase();
      const value = this.trim(row.slice(index + 1));

      if (typeof result[key] === 'undefined') {
        result[key] = value;
      } else if (this.isArray(result[key])) {
        result[key].push(value);
      } else {
        result[key] = [result[key], value];
      }
    }

    return result;
  }
}

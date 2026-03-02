// import {
//     CanActivate,
//     ExecutionContext,
//     Injectable,
//     Scope,
//     UnauthorizedException,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { RequestContextPreparationService } from '../context/request-context.service';
// import { ErrorEntity, HttpStatus, ResultEntity } from '@skm-universe/code-utils';
// import * as jwt from "jsonwebtoken";
// // import { TokenService } from '@Pandi2352/nestjs-backend-template-sdk/dist/src/modules/token-srv/services/classes/token.service';

// @Injectable({ scope: Scope.REQUEST })
// export class JWTAuthGuard implements CanActivate {
//     constructor(
//         private reflector: Reflector,
//         private requestContext: RequestContextPreparationService,
//     ) { }

//     async canActivate(context: ExecutionContext): Promise<boolean> {
//         const currentContext = this.requestContext.getCurrentContext();
//         const request = context.switchToHttp().getRequest();
//         try {
//             const access_token = await this.getTokenFromRequest(request);
//             const is_token_exist = await TokenService.Instance.getTokenEntryByToken(currentContext, access_token);
           
//             if (!is_token_exist) {
//                 throw new ErrorEntity({
//                     error: "un_authorized",
//                     error_description: "access denied for the resource",
//                     http_code: HttpStatus.UNAUTHORIZED
//                 });
//             }
            
//             if (is_token_exist?.expire_at < new Date()) {
//                 throw new ErrorEntity({
//                     error: "un_authorized",
//                     error_description: "access denied for the resource",
//                     http_code: HttpStatus.UNAUTHORIZED
//                 });
//             }
            
//             let claims;

//             const data: any = jwt.decode(access_token);
//             if (data && data.iss) {
//                 if (data.iss.endsWith('skill-mine.com')) {
//                     claims = data;
//                 }
//                 else if (data.iss == currentContext.base_url) {
//                     claims = data;
//                 }
//             } else {
//                 throw new ErrorEntity({ error: "un_authorized", error_description: "access denied for the resource", http_code: HttpStatus.UNAUTHORIZED });
//             }

//             currentContext.setUserContext(claims);
//             return Promise.resolve(true);
//         } catch (error) {
//             const resultEntity = new ResultEntity({ sucess: false });
//             resultEntity.error = error;
//             resultEntity.prepareResponse();
//             throw new UnauthorizedException(resultEntity);
//         }
//     }

//     async getTokenFromRequest(req: any): Promise<string> {

//         try {

//             let access_token = "";

//             const authorization_header: string = req.headers["authorization"];
//             if (authorization_header) {
//                 const authorization_header_split = authorization_header.split(" ");
//                 if (authorization_header_split.length == 2) {
//                     access_token = authorization_header_split[1];
//                 } else {
//                     throw new ErrorEntity({ http_code: HttpStatus.UNAUTHORIZED, error: "invalid_request", error_description: "invalid authentication token passed in authorization header, it must be Basic or Bearer token" });
//                 }
//             } else if (req.headers["access_token"]) {
//                 const access_token_header: string = req.headers["access_token"];
//                 if (!access_token_header) {
//                     throw new ErrorEntity({ http_code: HttpStatus.UNAUTHORIZED, error: "invalid_request", error_description: "invalid authentication token passed in authorization header, it must be Basic or Bearer token" });
//                 }
//                 access_token = access_token_header;

//             } else if (req.query && req.query["access_token"]) {
//                 access_token = req.query["access_token"].trim();
//             } else if (req.body && req.body["access_token"]) {
//                 access_token = req.body["access_token"].trim();
//             }

//             if (!access_token) {
//                 throw new ErrorEntity({ http_code: HttpStatus.UNAUTHORIZED, error: "invalid_request", error_description: "invalid authentication token passed in authorization header, it must be Basic or Bearer token" });

//             }
//             return Promise.resolve(access_token);



//         } catch (error) {
//             return Promise.reject(error);
//         }
//     }
// }

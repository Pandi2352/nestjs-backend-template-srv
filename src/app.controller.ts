import { Controller, Get } from '@nestjs/common';
import package_json from "../package.json";
const name = package_json.name;
const version = package_json.version;

@Controller()
export class AppController {
  constructor() { }

  @Get('/ping')
  getHello(): string {
    return `The Server is running succesfully ${name} ${version} !`;
  }
}
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from "@nestjs/swagger";
import * as dotenv from "dotenv";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import SwaggerTSApi from "swagger-typescript-api";
import {JwtStrategy} from "./auth/jwt.strategy";
import {ConfigService} from "@nestjs/config";


/*
*
*
*
* declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
*
* */
dotenv.config({ path: __dirname + "/.env" });
declare const module: any;
async function bootstrap() {

  const configService = new ConfigService();
  const NAME = configService.get<string>("NAME")

  const title = NAME+" API";
  const version = "1.0.0";


  //process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  const app = await NestFactory.create(AppModule);
  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
  // app.enableCors();
   app.setGlobalPrefix('/api');

  const config = new DocumentBuilder()
    .setTitle(title)
    .setVersion(version)
    .addBearerAuth()
     //.setDescription("<h1>Rate limit - "+JwtStrategy.ttl_limit+" requests per "+JwtStrategy.ttl+" second / IP</h1>")
      .setDescription("Rate limit - "+JwtStrategy.ttl_limit+" requests per "+JwtStrategy.ttl+" second / IP")

      // .addApiKey(undefined, "apiKey")
    .setLicense("Download TypeScript SDK", "/api/public/sdk.ts")
    .setExternalDoc("Download JSON scheme", "/api/public/scheme.json")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const swaggerCustomOptions: SwaggerCustomOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth:0,
      defaultModelExpandDepth:0,
      docExpansion: 'none'
    },
    customSiteTitle: NAME+' API',
  };
  swaggerCustomOptions.customSiteTitle = NAME+" sAPI";
  swaggerCustomOptions.customCss = ".swagger-ui .topbar  {display:none}";
  swaggerCustomOptions.customCss += ".swagger-ui .info .title:{max-height:100px}";
  SwaggerModule.setup("/api", app, document, swaggerCustomOptions);

  if (!fs.existsSync("./public")) fs.mkdirSync("./public");
  fs.writeFileSync("./public/scheme.json", JSON.stringify(document));



  SwaggerTSApi.generateApi({
    input: path.resolve(__dirname,  "../public/scheme.json"),
    output: path.resolve(__dirname,  "../public/"),
    httpClientType: "axios", // or "fetch"
    extractRequestParams: false,
    generateRouteTypes: true,
    // moduleNameFirstTag: true,
    generateResponses: true,
    prettier: {
      printWidth: 120,
      tabWidth: 2,
      trailingComma: "all",
      parser: "typescript",
    },
    // hooks: {
    //   onCreateRouteName: (routeNameInfo, rawRouteInfo) => {
    //     const split = rawRouteInfo.route.split("/").filter(x=>x!=='');
    //     split.splice(0,1);
    //     routeNameInfo.usage = split.join("")
    //     //routeNameInfo.usage.replace("Controller","");
    //     routeNameInfo.original = routeNameInfo.usage;
    //   },
    // }
  }).then(({ files, configuration }) => {
    fs.rename( path.resolve(__dirname,  "../public/.ts"), path.resolve(__dirname,  "../public/sdk.ts"), ()=>{/**/})
      // files.forEach(({ content, name }) => {
      //   fs.writeFile( path.resolve(__dirname,  "../public/"), content, ()=>{
      //     //
      //   });
      // });
    })
    .catch(e => console.error(e))




  app.useGlobalPipes(new ValidationPipe());

  console.log("start on http://localhost:" + process.env.PORT);
  await app.listen(Number(process.env.PORT));
}

bootstrap().then();

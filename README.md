# Challenge.fi-bot
A community management bot for the <a href="https://challenge.fi">challenge.fi</a> Discord, implementing a CTFd-platform integration.<br>
This bot is of course not limited to be used in that server, you may download these sources and use it in any Discord server.<br>
Instructions on how to do that will be below.
<br>
<br>
This project was originally developed by `Eemil S. (Esinko#7976)` at `Testausserveri ry` and completed on the `31st of December 2021`.
However, contributions are more than welcome.

## Enhancements
At the moment, there are multiple different ways this bot can be perfected.
1. Use slash command option types better. Basically, instead of having the user provide ids for roles, channels and users,
we should use specific types for those kinds of parameters.
2. Registering application commands. Currently the commands have to be registered every time the bot starts. Instead of that,
we should implement something that checks if the existing application command configuration matches the one we are about to apply.
This way we can remove the useless traffic of registering application commands again.

...and probably many more! Don't hesitate to create a new issue and mark it as an `enhancement`.

## Technical details
Let's get down to business and talk about the actually "interesting" details.<br>
This project uses Docker and Docker-Compose for deployment and testing.<br>
The project consists of two major components (containers):
1. The bot itself developed with `Node.Js v16.13` using `Discord.js` (in `/src`).
2. The database, in this case `MongoDB` (schemas in `/src/configuration/database_schemas.js`).

All relevant configuration is done with environment variables. See `.env.example`.

### Project structure

```
src
├───configuration <- Anything configuration related (Database schemas, application command configuration)
├───modules <- Application command modules, each file is a feature of the bot.
└───utils <- General utilities (usually single functions or short scripts).
```

### Installation/Deployment
As mentioned above, this project uses Docker and Docker-compose for deployment and testing.
No other dependencies are required.
<br>
After you have configured the required environment variables (see `.env.example`) you can launch the project with:
```
docker-compose up
```
And that's it!

### Running from source without using Docker
If you want to run the project from source, install `Node.Js 16.13.0` or later and install project dependencies with `npm install`.
Then just run `npm start`. Remember you need to run and configure a standalone MongoDB instance or use MongoDB Atlas, normally docker-compose does this for you.

# Contribution 
Contributions are more than welcome. If you want to contribute, clone this repository and after you've done your magic make a new pull request.
<br>
While making commits, use *conventional commits*, as we do in this project (learn more below).
<br>
All pull requests require manual review. Mention @Esinko or other repository maintainers if you see no activity for a few days.
<br>
To make this project faster, make sure you follow *code style* requirements. We use ESLint to maintain *code style* and the quality of the codebase.
Before making your contributions it is recommended you install it and before making a pull request you can validate your code by running `eslint ./`.
More information on how to use ESlint can be found below, but using Visual Studio Code with the ESLint extension is recommended.
Warnings from ESLint can be ignored, but you should consider them as signs of messy code.

# Development resources
- CTFd API v1 documentation: <a href="https://demo.ctfd.io/api/v1/">https://demo.ctfd.io/api/v1/</a>
- Discord API documentation: <a href="https://discord.com/developers/docs/intro">https://discord.com/developers/docs/intro</a>
- Discord.Js documentation: <a href="https://discord.js.org/#/docs/">https://discord.js.org/#/docs/</a>
- This project uses ESLint. Learn more: <a href="https://eslint.org/">https://eslint.org/</a>
- Conventional commits: <a href="https://www.conventionalcommits.org/en/v1.0.0/">https://www.conventionalcommits.org/en/v1.0.0/</a>

# License
MIT License

Copyright (c) 2021 Esinko, Testausserveri ry

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
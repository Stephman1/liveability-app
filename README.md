# Liveability app

## **Overview**

**Project Summary**

A liveability application that allows users to compare different zip codes and local areas in the US and UK.

**Authors**

- Stephen Keeler - stephman1 – keelers@seas.upenn.edu - [GitHub](https://github.com/stephman1)
- Shariq Lalani - slalani13 – shariqla@seas.upenn.edu - [GitHub](https://github.com/slalani13)
- Paul Sterritt - psterritt5 – paulster@seas.upenn.edu - [GitHub](https://github.com/psterritt5)
- Octavio Medina - octmedina – omedina@seas.upenn.edu - [GitHub](https://github.com/octmedina)

## **Usage**

### **Prerequisites** 
You will need to install the latest version of Node.js on your machine. You should verify
that the following commands run and give a reasonable output on your terminal:
```
npm -v
node - v
```
The recommended Node version is 19.3.x, where x can be any number - slightly older/newer
versions of Node would probably work as well. If you have problems with older Node versions, you
should update Node.

#### **For MacOS Users**

You will also need to install the XCode command-line tools (if you are using a Mac). To do this,
run:
```
xcode-select --install
```
If you have an (incompatible or outdated) XCode version from a previous installation, you might need to 
update it (see [here](https://stackoverflow.com/questions/42538171/how-to-update-xcode-command-line-tools)).

#### **For Windows Users**

On Windows, you will need to install Microsoft’s Visual Studio Build Tools (specifically, the C++
build tools). The ‘Desktop development with C++’ should show recommended modules but it is
recommended that you also install the CLI support modules.

You might find [this article](https://spin.atomicobject.com/node-gyp-windows/) helpful for troubleshooting if 
need be.

### **Installation**

Open a new terminal (on VS code) and cd into the server folder, then run npm install:
```
cd server
npm install
```
Do the same for the client (you should run cd ../client instead of cd client if in the /server folder):
```
cd client
npm install
```
This will download and save the required dependencies into the node_modules folder within the
/client and /server directories. You can now start the web client when ready to deploy.

### **Deployment**

Step 1.

First, you should start the server application by running the below commands in a terminal window:
```
cd server
npm start
``` 
This application (server.js) runs on the host ‘localhost’ and port 8080 as specified using the 
configuration file (config.json).

Step 2.

This application, by default, runs on localhost - port 3000. Once you run the below commands,
your default browser should open up a window to localhost:3000:
```
cd client
npm start
```
The web client is now running and can be accessed at http://localhost:3000.
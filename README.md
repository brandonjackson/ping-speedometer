# ping-speedometer

By Brandon Jackson

## About

Everyone knows that computers talk to each other pretty fast these days. But do you have any idea just how fast? `ping-speedometer` lets you see how quickly your computer can send a quick message, called a **ping**, to a website or server. It then estimates the server's based on its IP address, calculates the distance between you and the server, and then shows your computer's speed as a fraction of the speed of light.

## Installation

1. Install node
2. Install browserify: `node install -g browserify` 
3. Install dependencies: `npm install`

## Usage

1. Run `npm start`. This uses browserify to compile the javascript into 1 file, and then invokes node to start the express.js server.
2. Go to 127.0.0.1:3000 in your browser

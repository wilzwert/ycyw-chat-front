# You Car You Way - frontend

This project belongs to the 13th project of my course as a full-stack Java / Angular developer with OpenClassrooms.

The goal here is to create a simple chat system as a Proof of Concept (POC) in the context of a real-time support chat functionality on a web application.

This is an Angular frontend proposal that uses the backend that can be found on this repository https://github.com/wilzwert/ycyw.

##

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.3.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Test the POC frontend

Go to http://localohst:4200

You will then access the home page of the POC frontend. On this page you can :
- go directly to the chat ; in that case you will be queued as an anonymous user with a unique UUID as username
- go to login
  - to login as a customer / client you can use these test credentials : client / password
  - to login as a support user you can use these test credentials : support / password or agent / password
- if you logged in as a customer, go to the chat ; in that case you will be queues as "client"
- if you logged in as a support user, go to the support interface
  - in the support interface, there are 3 main areas :
    - users currently active, ie handled by the current support user
    - users requesting a chat session
    - the conversation display area
- 
## Features
### Security

- JWT Token authentication handled with API endpoints and localStorage
- JWT Token is added by an HTTP Interceptor to all HTTP Requests in an Authorization Header 
- Guards control which part of the app is accessible, based on the JWT Token provided by the API
- A JWT token must be present to use the chat
- As anonymous users should be able to ask questions to the support, an anonymous JWT Token can be retrieved from the API Auth endpoint
- Users can also log in with "real" usernames and passwords

## Conversations
- A user initiates a chat conversation with the support, which creates a unique conversation in the database
- The user is added in a queue of waiting users
- A support user can select a waiting user,which creates a chat message and informs the appropriate user and the other support users as well
- Support and initiator users are then connected and can send private messages to each other
- Private messages are persisted in the database as soon as they get sent to the backend 
- When a user is typing, the recipient is informed
- The conversation messages are stored as an history in localStorage
- When a user leaves the conversation, to navigate to another page or by mistake, the recipient is informed
- To allow users to reconnect after leaving, the conversation is not closed at once
- Pinging : a ping is sent every 5 seconds to ensure the recipient is still connected
- In case there is not response to the ping in 20 seconds, the conversation is closed
- When a conversation is closed, its end date is also stored in the database and the conversation is considered ended
- A user can also manually close a conversation
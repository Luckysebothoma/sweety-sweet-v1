# AmazingAnimalPaintings

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.1.1.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

--------------------------------------------------------------------------------------------------------------------------------------------------------
Step #1 - Install JSON Server

To install JSON Server in your application, navigate to your project directory in your terminal or command prompt and type in this command: npm install -g json-server. 
Step #2 - Create a JSON File

Create a JSON file in your project directory that will act as the data source. This JSON file should have a .json file extension. What do I mean? Let's say you want your JSON file name to be 'db', it means you'll create a file called db.json.
Step #3 - Create Data

Define your data inside the JSON file. This JSON data can be an array of objects or an object with nested objects. Each object represents a data entity and should each have a unique id.
Step #4 - Start the Server

Start up the JSON Server by typing this command into your terminal: 

json-server --watch db.json 

This will run on "https://localhost:3000" by default. You can change the port it's running on by specifying a different port number when starting the server using the --port flag. 


To create a chatbot, text-to-speech, speech-to-text, and image scanner with text extraction using Microsoft services (Azure), follow these steps. This integration will involve using Azure Bot Service, Azure Cognitive Services for Speech, and Azure Cognitive Services for Computer Vision.

### Prerequisites

1. **Azure Account**: Sign up for an Azure account if you don't have one.
2. **Azure Services**: Set up the following services:
   - Azure Bot Service
   - Azure Cognitive Services for Speech
   - Azure Cognitive Services for Computer Vision

### Angular Project Setup

1. **Create Angular Project**:
   ```bash
   ng new azure-integration
   cd azure-integration
   ```

2. **Install Required Packages**:
   ```bash
   npm install @azure/cognitiveservices-speech-sdk @microsoft/recognizers-text @azure/ms-rest-js @azure/cognitiveservices-computervision
   ```

### Chatbot Integration

1. **Azure Bot Service Setup**: 
   - Create a bot using the Azure Bot Service.
   - Obtain the bot's Direct Line secret.

2. **Chatbot Service**:
   ```typescript
   // src/app/chatbot.service.ts
   import { Injectable } from '@angular/core';
   import { HttpClient, HttpHeaders } from '@angular/common/http';
   import { Observable } from 'rxjs';

   @Injectable({
     providedIn: 'root',
   })
   export class ChatbotService {
     private apiUrl = 'https://directline.botframework.com/v3/directline/conversations';
     private secret = 'YOUR_DIRECT_LINE_SECRET';

     constructor(private http: HttpClient) {}

     sendMessage(conversationId: string, message: string): Observable<any> {
       const headers = new HttpHeaders({
         'Authorization': `Bearer ${this.secret}`,
       });
       const body = {
         type: 'message',
         from: { id: 'user1' },
         text: message,
       };
       return this.http.post(`${this.apiUrl}/${conversationId}/activities`, body, { headers });
     }

     startConversation(): Observable<any> {
       const headers = new HttpHeaders({
         'Authorization': `Bearer ${this.secret}`,
       });
       return this.http.post(this.apiUrl, {}, { headers });
     }
   }
   ```

3. **Chatbot Component**:
   ```typescript
   // src/app/chatbot/chatbot.component.ts
   import { Component, OnInit } from '@angular/core';
   import { ChatbotService } from '../chatbot.service';

   @Component({
     selector: 'app-chatbot',
     templateUrl: './chatbot.component.html',
   })
   export class ChatbotComponent implements OnInit {
     conversationId: string = '';
     userMessage: string = '';
     botResponses: string[] = [];

     constructor(private chatbotService: ChatbotService) {}

     ngOnInit() {
       this.chatbotService.startConversation().subscribe(
         response => {
           this.conversationId = response.conversationId;
         },
         error => {
           console.error('Error starting conversation:', error);
         }
       );
     }

     sendMessage() {
       this.chatbotService.sendMessage(this.conversationId, this.userMessage).subscribe(
         response => {
           this.botResponses.push(response.activities[0].text);
         },
         error => {
           console.error('Error sending message:', error);
         }
       );
     }
   }
   ```

### Text-to-Speech Integration

1. **Text-to-Speech Service**:
   ```typescript
   // src/app/text-to-speech.service.ts
   import { Injectable } from '@angular/core';
   import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';

   @Injectable({
     providedIn: 'root',
   })
   export class TextToSpeechService {
     private subscriptionKey = 'YOUR_AZURE_SPEECH_KEY';
     private region = 'YOUR_AZURE_REGION';

     convertTextToSpeech(text: string): void {
       const speechConfig = speechsdk.SpeechConfig.fromSubscription(this.subscriptionKey, this.region);
       const synthesizer = new speechsdk.SpeechSynthesizer(speechConfig);
       synthesizer.speakTextAsync(text,
         result => {
           if (result.reason === speechsdk.ResultReason.SynthesizingAudioCompleted) {
             console.log('Synthesis finished.');
           } else {
             console.error('Speech synthesis canceled, ' + result.errorDetails);
           }
           synthesizer.close();
         },
         error => {
           console.error(error);
           synthesizer.close();
         });
     }
   }
   ```

2. **Text-to-Speech Component**:
   ```typescript
   // src/app/voice/voice.component.ts
   import { Component } from '@angular/core';
   import { TextToSpeechService } from '../text-to-speech.service';

   @Component({
     selector: 'app-voice',
     templateUrl: './voice.component.html',
   })
   export class VoiceComponent {
     userText: string = '';

     constructor(private textToSpeechService: TextToSpeechService) {}

     convertToSpeech() {
       this.textToSpeechService.convertTextToSpeech(this.userText);
     }
   }
   ```

### Speech-to-Text Integration

1. **Speech-to-Text Service**:
   ```typescript
   // src/app/speech-to-text.service.ts
   import { Injectable } from '@angular/core';
   import * as speechsdk from 'microsoft-cognitiveservices-speech-sdk';

   @Injectable({
     providedIn: 'root',
   })
   export class SpeechToTextService {
     private subscriptionKey = 'YOUR_AZURE_SPEECH_KEY';
     private region = 'YOUR_AZURE_REGION';

     recognizeSpeech(): void {
       const speechConfig = speechsdk.SpeechConfig.fromSubscription(this.subscriptionKey, this.region);
       const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
       const recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);
       recognizer.recognizeOnceAsync(result => {
         if (result.reason === speechsdk.ResultReason.RecognizedSpeech) {
           console.log(`RECOGNIZED: Text=${result.text}`);
         } else {
           console.error('Error recognizing speech:', result.errorDetails);
         }
         recognizer.close();
       });
     }
   }
   ```

2. **Speech-to-Text Component**:
   ```typescript
   // src/app/speech/speech.component.ts
   import { Component } from '@angular/core';
   import { SpeechToTextService } from '../speech-to-text.service';

   @Component({
     selector: 'app-speech',
     templateUrl: './speech.component.html',
   })
   export class SpeechComponent {
     constructor(private speechToTextService: SpeechToTextService) {}

     recognizeSpeech() {
       this.speechToTextService.recognizeSpeech();
     }
   }
   ```

### Image Scanner with Text Extraction

1. **Computer Vision Service**:
   ```typescript
   // src/app/computer-vision.service.ts
   import { Injectable } from '@angular/core';
   import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
   import { ApiKeyCredentials } from '@azure/ms-rest-js';
   import { HttpClient, HttpHeaders } from '@angular/common/http';
   import { Observable } from 'rxjs';

   @Injectable({
     providedIn: 'root',
   })
   export class ComputerVisionService {
     private subscriptionKey = 'YOUR_COMPUTER_VISION_KEY';
     private endpoint = 'YOUR_COMPUTER_VISION_ENDPOINT';

     private client = new ComputerVisionClient(
       new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': this.subscriptionKey } }),
       this.endpoint
     );

     constructor(private http: HttpClient) {}

     extractText(imageUrl: string): Observable<any> {
       return this.http.post(`${this.endpoint}/vision/v3.2/read/analyze`, { url: imageUrl }, {
         headers: new HttpHeaders({
           'Ocp-Apim-Subscription-Key': this.subscriptionKey,
           'Content-Type': 'application/json'
         })
       });
     }
   }
   ```

2. **Image Scanner Component**:
   ```typescript
   // src/app/image-scanner/image-scanner.component.ts
   import { Component } from '@angular/core';
   import { ComputerVisionService } from '../computer-vision.service';

   @Component({
     selector: 'app-image-scanner',
     templateUrl: './image-scanner.component.html',
   })
   export class ImageScannerComponent {
     imageUrl: string = '';
     extractedText: string = '';

     constructor(private computerVisionService: ComputerVisionService) {}

     scanImage() {
       this.computerVisionService.extractText(this.imageUrl).subscribe(
         response => {
           const operationLocation = response.headers.get('Operation-Location');
           setTimeout(() => {
             this.getText(operationLocation);
           }, 3000); // wait for text extraction to complete
         },
         error => {
           console.error('Error extracting text:', error);
         }
       );
     }

     getText(operationLocation: string) {
       this.computerVisionService.getTextFromOperationLocation(operationLocation).subscribe(
         result => {
           const textResult = result.analyzeResult.readResults;
           this.extractedText = textResult.map(readResult => readResult.lines.map(line => line.text).join('\n')).join('\n');
         },
         error => {
           console.error('Error retrieving text:', error);
         }
       );
     }
   }
   ```

3. **Image Scanner HTML Template**:
   ```html
   <!-- src/app/image-scanner/image-scanner.component.html -->
   <div>
     <input [(ngModel)]="

imageUrl" placeholder="Enter image URL" />
     <button (click)="scanImage()">Scan Image</button>
   </div>
   <div *ngIf="extractedText">
     <p>Extracted Text:</p>
     <pre>{{ extractedText }}</pre>
   </div>
   ```

### Summary

This setup demonstrates how to integrate various Microsoft Azure services into an Angular project, providing functionalities like chatbots, text-to-speech, speech-to-text, and image scanning with text extraction. Ensure to replace placeholders with your actual Azure keys and endpoints.# appAngularSweetySweet
# sweety-sweet-v1

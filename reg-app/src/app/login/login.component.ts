import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router,NavigationExtras } from '@angular/router';
import { FlashMessagesService } from 'angular2-flash-messages';

import { Inject }  from '@angular/core';
import { DOCUMENT } from '@angular/common'; 
import * as Msal from 'msal';
import { callbackify } from 'util';


 // Browser check variables
 var ua = window.navigator.userAgent;
 var msie = ua.indexOf('MSIE ');
 var msie11 = ua.indexOf('Trident/');
 var msedge = ua.indexOf('Edge/');
 var isIE = msie > 0 || msie11 > 0;
 var isEdge = msedge > 0;

 //If you support IE, our recommendation is that you sign-in using Redirect APIs
 //If you as a developer are testing using Edge InPrivate mode, please add "isEdge" to the if check

 // can change this to default an experience outside browser use
 var loginType = isIE ? "REDIRECT" : "POPUP";

 var msalConfig;
 var myMSALObj;
 var graphConfig;
 var requestObj;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username: String;
  password: String;

  msalConfig;
  myMSALObj;
  graphConfig;
  requestObj;

  constructor(
    private authService: AuthService,
    private router: Router,
    private flashMessage: FlashMessagesService,
    @Inject(DOCUMENT) document) {
      
      msalConfig = {
        auth: {
            clientId: '8fee23d4-1365-4421-b069-7092641842e3', //This is your client ID
            authority: "https://login.microsoftonline.com/my.centennialcollege.ca" //This is your tenant info
        },
        cache: {
            cacheLocation: "localStorage" ,
            storeAuthStateInCookie: true
        }
      };

      graphConfig = {
        graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
      };

      myMSALObj = new Msal.UserAgentApplication(msalConfig);
      
      requestObj = {
        scopes: ["user.read"]
      };
      
      myMSALObj.handleRedirectCallback(this.authRedirectCallBack);

       // runs on page load, change config to try different login types to see what is best for your application
    if (loginType === 'POPUP') {
      if (myMSALObj.getAccount()) {// avoid duplicate code execution on page load in case of iframe and popup window.
          this.showWelcomeMessage();
          this.acquireTokenPopupAndCallMSGraph();
      }
  }
  else if (loginType === 'REDIRECT') {
      document.getElementById("SignIn").onclick = function () {
          myMSALObj.loginRedirect(requestObj);
      };

      if (myMSALObj.getAccount() && !myMSALObj.isCallback(window.location.hash)) {// avoid duplicate code execution on page load in case of iframe and popup window.
        this.showWelcomeMessage();
        this.acquireTokenRedirectAndCallMSGraph();
      }
  } else {
      console.error('Please set a valid login type');
  }
     }

     signIn() {
      myMSALObj.loginPopup(requestObj).then(()=> {
        //Successful login
        //this.showWelcomeMessage();
        var divWelcome = document.getElementById('WelcomeMessage');
        var htmlStr = "Welcome " + myMSALObj.getAccount().userName + " to Microsoft Graph API";
        //Call MS Graph using the token in the response
        this.acquireTokenPopupAndCallMSGraph();
        var micName = myMSALObj.getAccount().userName;
        var micJustName = myMSALObj.getAccount().name;
        //console.log(myMSALObj.getAccount());

        //INSERT INTO MONGO
        const user = {
          name: myMSALObj.getAccount().name,
          email: myMSALObj.getAccount().userName,
          username: myMSALObj.getAccount().userName,
          password: 'password'
        }
    
        this.authService.registeroAuthUser(user).subscribe(data => {
          console.log(data)
        if(data.success) {
          console.log('success')
            this.flashMessage.show('You are now authenticated! ', {cssClass: 'alert-success', timeout: 3000});
            const navigationExtras: NavigationExtras = {state: {micName:micName}};
            this.router.navigate(['dashboard'],navigationExtras);
          } else {
            console.log('failure')
            this.flashMessage.show('Oops something went wrong!', {cssClass: 'alert-danger', timeout: 3000});
            this.router.navigate(['/register']);
          }
        });

    }).catch(function (error) {
          //Please check the console for errors
          console.log(error);
      });
    }

    showWelcomeMessage() {
      var divWelcome = document.getElementById('WelcomeMessage');
      var htmlStr = "Welcome " + myMSALObj.getAccount().userName + " to Microsoft Graph API";

      //var loginbutton = document.getElementById('SignIn');
      //loginbutton.innerHTML = 'Sign Out';
      //loginbutton.setAttribute('onclick', 'signOut();');
    }

    acquireTokenPopupAndCallMSGraph() {
      //Always start with acquireTokenSilent to obtain a token in the signed in user from cache
      myMSALObj.acquireTokenSilent(requestObj).then((tokenResponse) => {
          this.callMSGraph(graphConfig.graphMeEndpoint, tokenResponse.accessToken, this.graphAPICallback);
      }).catch((error)=> {
          console.log(error);
          // Upon acquireTokenSilent failure (due to consent or interaction or login required ONLY)
          // Call acquireTokenPopup(popup window) 
          if (this.requiresInteraction(error.errorCode)) {
              myMSALObj.acquireTokenPopup(requestObj).then((tokenResponse) => {
                  this.callMSGraph(graphConfig.graphMeEndpoint, tokenResponse.accessToken, this.graphAPICallback);
              }).catch((error)=> {
                  console.log(error);
              });
          }
      });
    }

    acquireTokenRedirectAndCallMSGraph() {
      //Always start with acquireTokenSilent to obtain a token in the signed in user from cache
      myMSALObj.acquireTokenSilent(requestObj).then((tokenResponse) => {
          this.callMSGraph(this.graphConfig.graphMeEndpoint, tokenResponse.accessToken, this.graphAPICallback);
      }).catch(function (error) {
          console.log(error);
          // Upon acquireTokenSilent failure (due to consent or interaction or login required ONLY)
          // Call acquireTokenRedirect
          if (this.requiresInteraction(error.errorCode)) {
              myMSALObj.acquireTokenRedirect(requestObj);
          }
      });
    }

    requiresInteraction(errorCode) {
      if (!errorCode || !errorCode.length) {
          return false;
      }
      return errorCode === "consent_required" ||
          errorCode === "interaction_required" ||
          errorCode === "login_required";
    }
    signOut() {
      myMSALObj.logout();
    }

    callMSGraph(theUrl, accessToken, callback) {
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200)
              callback(JSON.parse(this.responseText));
      }
      xmlHttp.open("GET", theUrl, true); // true for asynchronous
      xmlHttp.setRequestHeader('Authorization', 'Bearer ' + accessToken);
      xmlHttp.send();
    }

    graphAPICallback(data) {
      //document.getElementById("json").innerHTML = JSON.stringify(data, null, 2); 
    }

    authRedirectCallBack(error, response) {
      if (error) {
          console.log(error);
      } else {
          if (response.tokenType === "access_token") {
              this.callMSGraph(graphConfig.graphMeEndpoint, response.accessToken, this.graphAPICallback);
          } else {
              console.log("token type is:" + response.tokenType);
          }
      }
    }

  ngOnInit() {
  }

  onLoginSubmit() {
    const user = {
      username: this.username,
      password: this.password
    }

    this.authService.authenticateUser(user).subscribe(data => {
      if (data.success) {
        this.authService.storeUserData(data.token, data.user);
        this.flashMessage.show('You are now logged in!' + { cssClass: 'alert-success', timeout: 5000 });
        this.router.navigate(['dashboard', data.user]);
      } else {
        //this.flashMessage.show(data.msg, { cssClass: 'alert-danger', timeout: 5000 });
        this.router.navigate(['login']);
      }
    });
  }
}

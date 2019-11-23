import { Component, OnInit } from '@angular/core';
import { FlashMessagesService } from 'angular2-flash-messages';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { Inject }  from '@angular/core';
import { DOCUMENT } from '@angular/common'; 

import * as Msal from 'msal';

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
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  name: String;
  username: String;
  email: String;
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
      
    }

  ngOnInit() { }

  
  onRegisterSubmit() {
    const user = {
      name: this.name,
      email: this.email,
      username: this.username,
      password: this.password
    }

    // Register user
    this.authService.registerUser(user).subscribe(data => {
      //console.log(data)
    if(data.success) {
      this.flashMessage.show('You are now registered and can now login', {cssClass: 'alert-success', timeout: 3000});
      this.router.navigate(['/login']);
    } else {
      this.flashMessage.show('Something went wrong', {cssClass: 'alert-danger', timeout: 3000});
      this.router.navigate(['/register']);
    }
  });
  }

}

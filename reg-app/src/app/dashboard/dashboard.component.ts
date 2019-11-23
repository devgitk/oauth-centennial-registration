import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  name: String;
  username: String;
  email: String;
  password: String;

  micName: string;
  constructor(private authService: AuthService, private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    console.log(navigation);
    const state = navigation.extras.state as {micName: string};
    this.micName = state.micName;
    console.log(this.micName);
   }

  ngOnInit() {
  }

}

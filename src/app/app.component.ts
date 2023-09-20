import { Component } from '@angular/core';
import { AuthenticationResult } from '@azure/msal-browser';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'microsoft-login';

  constructor(private msalService: MsalService) {
    
  }

  isLoggedIn() : boolean{
    return this.msalService.instance.getActiveAccount() !=null
  }

  login() {
    this.msalService.loginPopup().subscribe( (response: AuthenticationResult) => {
      this.msalService.instance.setActiveAccount(response.account)
    });
  }

logout() {
  this.msalService.logout();
}
}
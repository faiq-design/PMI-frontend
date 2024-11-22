import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { DashboardService } from '../layout/dashboard/dashboard.service';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';
import { Config } from 'src/assets/config';
import { NgxSpinnerService } from 'ngx-spinner';
import { IdleService } from '../idle-service.service';
import { v4 as uuidv4 } from 'uuid';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: any = {
    userName: '',
    password: ''
  };
  loadingData = false;
  appName = Config.APP_NAME;
  errorMessage: any;

  constructor(
    private router: Router,
    private httpService: DashboardService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private idleService: IdleService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.errorMessage = null;
    localStorage.clear();

    this.route.queryParams.subscribe((params) => {
      this.errorMessage = decodeURIComponent(params['error'] || '');

      if (this.errorMessage) {
        this.toastr.error(this.errorMessage, 'Unauthorized');
      }
    });
  }

  onLogin(loginForm: any) {
    this.spinner.show();
    this.httpService.login(loginForm).subscribe(
      (data: Response) => {
        const res: any = data;
        localStorage.clear();
        localStorage.setItem('isLoggedin', 'true');
        localStorage.setItem('today', moment(new Date()).format('YYYY-MM-DD'));
        if (res.Authenticated === true) {
          localStorage.setItem('user_id', res.user.userId);
          localStorage.setItem('regionId', res.user.regionIds);
          localStorage.setItem('username', res.user.userName);
          localStorage.setItem('user_type', res.user.typeId);
          localStorage.setItem('user_zone_id', res.user.zoneIds);
          localStorage.setItem('menu', JSON.stringify(res.list));
          localStorage.setItem('towns', JSON.stringify(res.town));
          localStorage.setItem('regions', JSON.stringify(res.regions));
          localStorage.setItem('zones', JSON.stringify(res.zones));
          localStorage.setItem('projectName', res.projectName);
          localStorage.setItem('projectType', res.projectType);
          // // console.log("allowed links",localStorage.getItem("allowedLinks"));
          // // debugger;

          this.idleService.startWatching();
          if (res.user.typeId === 4) {
            this.router.navigate(['/dashboard/productivity_report']).then(() => {
              // Force recheck by triggering the navigation event that uses AuthGuard
              this.router.navigate(['/dashboard/productivity_report']);
            });
          } else {
            this.router.navigate(['/dashboard/home']).then(() => {
              // Force recheck by triggering the navigation event that uses AuthGuard
              this.router.navigate(['/dashboard/home']);
            });
          }

          setTimeout(() => {
            this.spinner.hide();
          }, 30000);
        } else {
          this.toastr.warning(res.User);
          this.spinner.hide();
        }
      },
      (error: HttpErrorResponse) => {
        this.spinner.hide();
        if (error.status === 403) {
          this.toastr.error(error.error.description, 'Error');
        } else if (error.status === 400) {
          this.toastr.error(error.error.description, 'Error');
        } else if (error.status === 500) {
          this.toastr.error('Internal server error', 'Error');
        } else {
          this.toastr.error(error.message, 'Error');
        }
      }
    );
  }

  forgotPassword() {
    this.loadingData = true;
    if (!this.loginForm.userName) {
      // If userName is empty, show error message
      alert('Please enter a user name before proceeding with forgot password.');
      return;
    }
    // debugger;
    const uniqueKey = uuidv4();
    const obj = {
      userName: this.loginForm.userName,
      uniqueKey: uniqueKey,
      type: 'Web'
    };
    // debugger;
    this.httpService.forgotPassword(obj).subscribe(
      (data: any) => {
        if (data.status) {
          this.toastr.success(data.message, 'Success');
        } else {
          this.toastr.error(data.message, 'Error');
        }
        this.loadingData = false;
      },
      (error) => {
        this.toastr.error(error.message, 'Error');
        this.loadingData = false;
      }
    );
  }
}
